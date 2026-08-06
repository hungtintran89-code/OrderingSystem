package ordersystem.backend.modules.payment.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.exception.OrderException;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.payment.config.PayOSConfig;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import ordersystem.backend.modules.payment.entity.PaymentTransactionEntity;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentTransactionRepository;
import ordersystem.backend.modules.payment.service.impl.PayOSService;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.exception.TableException;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.type.*;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PayOSServiceImpl implements PayOSService {

    private final PayOSConfig payOSConfig;
    private final TableSessionRepository tableSessionRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;

    @Override
    @Transactional
    public PaymentLinkResponse createVietQrPaymentLink(Long tableSessionId){
        PayOS payOS = payOSConfig.getPayOSInstance();

        //Kiểm tra table session có hợp lệ không
        TableSessionEntity session = tableSessionRepository.findById(tableSessionId)
                .orElseThrow( () -> new TableException("Session ID not found: " + tableSessionId));

        //Lấy ra master order của table session này để tính tổng tiền
        OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionIdAndStatus(tableSessionId, OrderStatus.PENDING)
                .orElseThrow( () -> new OrderException("Master Order not found with table session + " + session.getTableSessionId()));

        Long grandTotal = masterOrder.getTotalAmount();

        if (grandTotal <= 0){
            throw  new PaymentException("Invalid total invoice");
        }

        // =========================================================================
        // TẠO BẢN GHI TRANSACTION TRƯỚC ĐỂ LẤY PRIMARY KEY DUY NHẤT
        // =========================================================================
        // Nếu trước đó có mã QR bị CANCELLED/FAILED, ta hủy nốt các transaction PENDING cũ của session này
        transactionRepository.findByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING)
                .ifPresent(oldTx -> {
                    oldTx.setPaymentStatus(PaymentStatus.CANCELLED);
                });

        // Tạo Transaction MỚI cho LẦN THỬ thanh toán này
        PaymentTransactionEntity newTransaction = PaymentTransactionEntity.builder()
                .invoiceCode("INV_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tableSession(session)
                .totalAmount(grandTotal)
                .paymentMethod(PaymentMethod.VIETQR)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        // Save lần 1 để JPA tự động sinh payment_id (VD: payment_id = 102)
        newTransaction = transactionRepository.save(newTransaction);

        //Lấy paymentId gán cho payOrderCode, để mỗi lần tạo sinh payOrderCode duy nhất
        Long payosOrderCode = newTransaction.getPaymentId();
        newTransaction.setPayosOrderCode(payosOrderCode);

        //Tạo thông tin gửi sang PayOS
        String description = "TT BAN " + session.getTableName();
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        ItemData item = ItemData.builder()
                .name("Hoa don " + session.getTableName())
                .quantity(1)
                .price(Math.toIntExact(grandTotal))
                .build();
        PaymentData paymentData = PaymentData.builder()
                .orderCode(payosOrderCode)
                .amount(Math.toIntExact(grandTotal))
                .description(description)
                .returnUrl("https://localhost:8080/api/v1/success")
                .cancelUrl("https://localhost:8080/api/v1/cancel")
                .item(item)
                .build();

        try {
            // 4. Gọi API PayOS tạo link QR mới
            CheckoutResponseData responseData = payOS.createPaymentLink(paymentData);
            // 5. Cập nhật QR URL vào Transaction
            newTransaction.setQrUrl(responseData.getQrCode());
            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(responseData.getQrCode())
                    .build();
        } catch (Exception e) {
            // Nếu lỗi tạo link, đánh dấu Transaction này FAILED
            newTransaction.setPaymentStatus(PaymentStatus.FAILED);
            throw new PaymentException("Error generating VietQR PayOS code: " + e.getMessage());
        }
    }

    @Override
    public WebhookData verifyAndExtractWebhookData(Webhook webhookBody) {
        PayOS payOS = payOSConfig.getPayOSInstance();
        try {
            return payOS.verifyPaymentWebhookData(webhookBody);
        } catch (Exception e) {
            throw new RuntimeException("Invalid PayOS Webhook Signature!");
        }
    }
}
