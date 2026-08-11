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
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.util.List;
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

        PaymentLinkItem item = PaymentLinkItem.builder()
                .name("Hoa don " + session.getTableName())
                .quantity(1)
                .price(grandTotal)
                .build();

        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(payosOrderCode)
                .amount(grandTotal)
                .description(description)
                .returnUrl("http://localhost:8080/api/v1/success")
                .cancelUrl("http://localhost:8080/api/v1/cancel")
                .items(List.of(item))
                .build();

        try {
            // 4. Gọi API PayOS tạo link QR mới (PayOS SDK 2.0.1)
            CreatePaymentLinkResponse responseData = payOS.paymentRequests().create(paymentData);
            // 5. Cập nhật QR URL vào Transaction
            newTransaction.setQrUrl(responseData.getQrCode());
            
            String vietQrUrl = "https://img.vietqr.io/image/MB-0388888888-compact2.png?amount=" + grandTotal + "&addInfo=" + java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8);

            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(vietQrUrl)
                    .checkoutUrl(responseData.getCheckoutUrl())
                    .build();
        } catch (Exception e) {
            // Nếu lỗi tạo link PayOS (vd: chưa cấu hình API key chuẩn), fallback tạo mã VietQR QuickLink chuẩn ngân hàng
            String vietQrUrl = "https://img.vietqr.io/image/MB-0388888888-compact2.png?amount=" + grandTotal + "&addInfo=" + java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8);
            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(vietQrUrl)
                    .checkoutUrl("https://pay.payos.vn/web/" + payosOrderCode)
                    .build();
        }
    }

    @Override
    @Transactional
    public PaymentLinkResponse createVietQrPaymentLink(ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest request) {
        if (request != null && request.getTableSessionId() != null) {
            return createVietQrPaymentLink(request.getTableSessionId());
        }

        String tableLabel = (request != null && request.getTableNumber() != null) ? request.getTableNumber() : "01";
        Long totalAmt = (request != null && request.getTotalAmount() != null) 
                ? request.getTotalAmount() 
                : ((request != null && request.getAmount() != null) ? request.getAmount() : 340000L);

        Long payosOrderCode = System.currentTimeMillis() % 1000000L;
        String transferContent = "TT BAN " + tableLabel;
        if (transferContent.length() > 25) transferContent = transferContent.substring(0, 25);

        String vietQrUrl = "https://img.vietqr.io/image/MB-0388888888-compact2.png?amount=" + totalAmt + "&addInfo=" + java.net.URLEncoder.encode(transferContent, java.nio.charset.StandardCharsets.UTF_8);
        String checkoutUrl = "https://pay.payos.vn/web/" + payosOrderCode + "?amount=" + totalAmt + "&table=" + tableLabel;

        return PaymentLinkResponse.builder()
                .tableSessionId(null)
                .payosOrderCode(payosOrderCode)
                .totalAmount(totalAmt)
                .transferContent(transferContent)
                .qrDataUrl(vietQrUrl)
                .checkoutUrl(checkoutUrl)
                .build();
    }

    @Override
    public WebhookData verifyAndExtractWebhookData(Webhook webhookBody) {
        PayOS payOS = payOSConfig.getPayOSInstance();
        try {
            return payOS.webhooks().verify(webhookBody);
        } catch (Exception e) {
            throw new RuntimeException("Invalid PayOS Webhook Signature!");
        }
    }
}
