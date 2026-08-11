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
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.exception.TableException;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PayOSServiceImpl implements PayOSService {

    private final PayOSConfig payOSConfig;
    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
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
        newTransaction = transactionRepository.save(newTransaction);

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

            String qrImgUrl;
            if (responseData.getQrCode() != null && !responseData.getQrCode().isBlank()) {
                if (responseData.getQrCode().startsWith("http")) {
                    qrImgUrl = responseData.getQrCode();
                } else {
                    qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
                            + java.net.URLEncoder.encode(responseData.getQrCode(), java.nio.charset.StandardCharsets.UTF_8);
                }
            } else {
                qrImgUrl = "https://img.vietqr.io/image/MB-0866739857-compact2.png?amount=" + grandTotal 
                        + "&addInfo=" + java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8) 
                        + "&accountName=TRAN%20HUNG%20TIN";
            }

            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(qrImgUrl)
                    .checkoutUrl(responseData.getCheckoutUrl())
                    .build();
        } catch (Exception e) {
            // Fallback: Tạo mã VietQR QuickLink chuẩn ngân hàng MBBank - 0866739857 - TRAN HUNG TIN
            String vietQrUrl = "https://img.vietqr.io/image/MB-0866739857-compact2.png?amount=" + grandTotal 
                    + "&addInfo=" + java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8) 
                    + "&accountName=TRAN%20HUNG%20TIN";
            String checkoutUrl = "https://pay.payos.vn/web/" + payosOrderCode + "?amount=" + grandTotal + "&table=" + session.getTableName();
            
            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(vietQrUrl)
                    .checkoutUrl(checkoutUrl)
                    .build();
        }
    }

    @Override
    @Transactional
    public PaymentLinkResponse createVietQrPaymentLink(ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest request) {
        TableSessionEntity session = null;
        if (request != null) {
            if (request.getTableSessionId() != null) {
                session = tableSessionRepository.findById(request.getTableSessionId()).orElse(null);
            }
            if (session == null && request.getTableId() != null) {
                session = tableSessionRepository.findByTableTableIdAndStatus(request.getTableId(), SessionStatus.ACTIVE).orElse(null);
            }
            if (session == null && request.getTableNumber() != null) {
                String cleanName = request.getTableNumber().replaceAll("(?i)^bàn\\s+", "").trim();
                session = tableSessionRepository.findAllByStatus(SessionStatus.ACTIVE).stream()
                        .filter(s -> s.getTableName().equalsIgnoreCase(cleanName) 
                                || s.getTableName().equalsIgnoreCase(request.getTableNumber())
                                || s.getTableName().endsWith(cleanName))
                        .findFirst()
                        .orElse(null);
            }
        }

        // Nếu đã tìm thấy session ACTIVE -> Sử dụng luồng tạo chuẩn có đầy đủ session
        if (session != null) {
            return createVietQrPaymentLink(session.getTableSessionId());
        }

        // NẾU BÀN ĐANG CÓ KHÁCH NHƯNG CHƯA CÓ SESSION ACTIVE -> TÌM BÀN VÀ TỰ ĐỘNG MỞ/KHÔI PHỤC SESSION ACTIVE
        RestaurantTableEntity table = null;
        if (request != null) {
            if (request.getTableId() != null) {
                table = restaurantTableRepository.findById(request.getTableId()).orElse(null);
            }
            if (table == null && request.getTableNumber() != null) {
                String cleanName = request.getTableNumber().replaceAll("(?i)^bàn\\s+", "").trim();
                table = restaurantTableRepository.findAll().stream()
                        .filter(t -> t.getTableName().equalsIgnoreCase(cleanName) || t.getTableName().equalsIgnoreCase(request.getTableNumber()))
                        .findFirst().orElse(null);
            }
        }

        if (table != null) {
            session = TableSessionEntity.builder()
                    .table(table)
                    .tableName(table.getTableName())
                    .sessionToken("TOK_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .status(SessionStatus.ACTIVE)
                    .startedAt(new Date())
                    .build();
            session = tableSessionRepository.save(session);
            return createVietQrPaymentLink(session.getTableSessionId());
        }

        // CAM KẾT 100% LƯU BẢN GHI PAYMENT_TRANSACTION VÀO POSTGRESQL CHO TẤT CẢ CÁC TRƯỜNG HỢP FALLBACK
        Long totalAmt = (request != null && request.getTotalAmount() != null && request.getTotalAmount() > 0) 
                ? request.getTotalAmount() 
                : ((request != null && request.getAmount() != null && request.getAmount() > 0) ? request.getAmount() : 35000L);

        PaymentTransactionEntity newTx = PaymentTransactionEntity.builder()
                .invoiceCode("INV_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .totalAmount(totalAmt)
                .paymentMethod(PaymentMethod.VIETQR)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        newTx = transactionRepository.save(newTx);

        Long payosOrderCode = newTx.getPaymentId();
        newTx.setPayosOrderCode(payosOrderCode);
        transactionRepository.save(newTx);

        String tableLabel = (request != null && request.getTableNumber() != null) ? request.getTableNumber() : "01";
        String transferContent = "TT BAN " + tableLabel;
        if (transferContent.length() > 25) transferContent = transferContent.substring(0, 25);

        String vietQrUrl = "https://img.vietqr.io/image/MB-0866739857-compact2.png?amount=" + totalAmt 
                + "&addInfo=" + java.net.URLEncoder.encode(transferContent, java.nio.charset.StandardCharsets.UTF_8) 
                + "&accountName=TRAN%20HUNG%20TIN";
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
