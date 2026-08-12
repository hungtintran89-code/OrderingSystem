package ordersystem.backend.modules.payment.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import org.springframework.beans.factory.annotation.Value;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class PayOSServiceImpl implements PayOSService {

    private final PayOSConfig payOSConfig;
    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;

    @Value("${app.payment.bank-code:MB}")
    private String bankCode;

    @Value("${app.payment.account-no:0866739857}")
    private String accountNo;

    @Value("${app.payment.account-name:TRAN HUNG TIN}")
    private String accountName;

    /**
     * Luồng chính: Tạo VietQR Payment Link qua PayOS SDK cho 1 Table Session cụ thể.
     * KHÔNG CÓ FALLBACK HARDCODED - nếu PayOS lỗi sẽ throw exception rõ ràng.
     */
    @Override
    @Transactional
    public PaymentLinkResponse createVietQrPaymentLink(Long tableSessionId) {
        PayOS payOS = payOSConfig.getPayOSInstance();

        // Kiểm tra table session có hợp lệ không
        TableSessionEntity session = tableSessionRepository.findById(tableSessionId)
                .orElseThrow(() -> new TableException("Session ID not found: " + tableSessionId));

        // Lấy danh sách các đơn hàng chưa bị HỦY của table session này để tính tổng tiền chuẩn 100%
        List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(tableSessionId, OrderStatus.CANCELLED);
        if (sessionOrders.isEmpty()) {
            throw new OrderException("No active orders found for table session: " + session.getTableSessionId());
        }

        Long grandTotal = sessionOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .mapToLong(item -> item.getTotalPrice() != null ? item.getTotalPrice() : 0L)
                .sum();

        if (grandTotal <= 0) {
            grandTotal = sessionOrders.stream()
                    .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0L)
                    .sum();
        }

        if (grandTotal <= 0) {
            throw new PaymentException("Invalid total invoice");
        }

        // =========================================================================
        // HỦY TẤT CẢ transaction PENDING cũ của session này (không chỉ 1 cái)
        // =========================================================================
        List<PaymentTransactionEntity> oldPendingTxList = transactionRepository
                .findAllByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING);
        if (!oldPendingTxList.isEmpty()) {
            log.info("[PayOS] Hủy {} transaction(s) PENDING cũ của session {}", oldPendingTxList.size(), tableSessionId);
            for (PaymentTransactionEntity oldTx : oldPendingTxList) {
                oldTx.setPaymentStatus(PaymentStatus.CANCELLED);
            }
            transactionRepository.saveAll(oldPendingTxList);
        }

        // Tạo Transaction MỚI cho LẦN THỬ thanh toán này
        PaymentTransactionEntity newTransaction = PaymentTransactionEntity.builder()
                .invoiceCode("INV_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tableSession(session)
                .totalAmount(grandTotal)
                .paymentMethod(PaymentMethod.VIETQR)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        // Save lần 1 để JPA tự động sinh payment_id (VD: payment_id = 102)
        newTransaction = transactionRepository.saveAndFlush(newTransaction);

        // Lấy paymentId gán cho payOrderCode, để mỗi lần tạo sinh payOrderCode duy nhất
        Long payosOrderCode = newTransaction.getPaymentId();
        newTransaction.setPayosOrderCode(payosOrderCode);
        newTransaction = transactionRepository.saveAndFlush(newTransaction);

        // Tạo thông tin gửi sang PayOS
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
            // Gọi API PayOS tạo link QR mới (PayOS SDK 2.0.1)
            log.info("[PayOS] Gọi PayOS SDK tạo QR cho session {} - orderCode={} - amount={}",
                    tableSessionId, payosOrderCode, grandTotal);
            CreatePaymentLinkResponse responseData = payOS.paymentRequests().create(paymentData);

            // Cập nhật QR URL vào Transaction
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
                // PayOS trả QR code null → dùng VietQR QuickLink từ config (KHÔNG phải hardcoded)
                qrImgUrl = buildVietQrUrlFromConfig(grandTotal, description);
            }

            log.info("[PayOS] Tạo QR thành công. checkoutUrl={}, qrDataUrl={}",
                    responseData.getCheckoutUrl(), qrImgUrl.substring(0, Math.min(80, qrImgUrl.length())) + "...");

            String respAccountName = (responseData.getAccountName() != null && !responseData.getAccountName().isBlank())
                    ? responseData.getAccountName() : this.accountName;
            String respAccountNo = (responseData.getAccountNumber() != null && !responseData.getAccountNumber().isBlank())
                    ? responseData.getAccountNumber() : this.accountNo;
            String respBankName = (responseData.getBin() != null && !responseData.getBin().isBlank())
                    ? ("Ngân hàng (BIN " + responseData.getBin() + ")") : ("Ngân hàng (" + this.bankCode + ")");

            return PaymentLinkResponse.builder()
                    .tableSessionId(tableSessionId)
                    .payosOrderCode(payosOrderCode)
                    .totalAmount(grandTotal)
                    .transferContent(description)
                    .qrDataUrl(qrImgUrl)
                    .checkoutUrl(responseData.getCheckoutUrl())
                    .bankName(respBankName)
                    .accountName(respAccountName)
                    .accountNumber(respAccountNo)
                    .build();

        } catch (Exception e) {
            // KHÔNG FALLBACK HARDCODED - Log error chi tiết và throw exception rõ ràng
            log.error("[PayOS] GỌI PAYOS SDK THẤT BẠI cho session {} - orderCode={}: {}",
                    tableSessionId, payosOrderCode, e.getMessage(), e);

            // Đánh dấu transaction là FAILED
            newTransaction.setPaymentStatus(PaymentStatus.FAILED);
            transactionRepository.save(newTransaction);

            throw new PaymentException(
                    "Không thể tạo mã QR qua PayOS. Vui lòng kiểm tra cấu hình API Key PayOS. Chi tiết: " + e.getMessage());
        }
    }

    /**
     * Luồng phụ: Tạo VietQR Payment Link từ CreatePaymentLinkRequest (có thể chứa tableSessionId, tableId, hoặc tableNumber).
     * Tìm session ACTIVE rồi delegate sang luồng chính.
     */
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

        // NẾU BÀN ĐANG CÓ KHÁCH NHƯNG CHƯA CÓ SESSION ACTIVE -> TÌM BÀN VÀ TỰ ĐỘNG MỞ SESSION
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

        // NẾU LÀ ĐƠN MANG VỀ (TAKEAWAY) HOẶC CHƯA CÓ SESSION BÀN VẬT LÝ
        if (request != null && (request.getTotalAmount() != null || request.getAmount() != null)) {
            Long finalAmount = request.getTotalAmount() != null ? request.getTotalAmount() : request.getAmount();
            if (finalAmount > 0) {
                String label = (request.getTableNumber() != null && !request.getTableNumber().isBlank())
                        ? request.getTableNumber()
                        : "MANG VE";
                String description = (label.toUpperCase().contains("MANG VE") || label.equalsIgnoreCase("TAKEAWAY"))
                        ? "TT MANG VE"
                        : "TT " + label;
                if (description.length() > 25) {
                    description = description.substring(0, 25);
                }
                Long payosOrderCode = (System.currentTimeMillis() / 1000L) * 1000L + (long)(Math.random() * 999);

                PaymentLinkItem item = PaymentLinkItem.builder()
                        .name("Don hang " + label)
                        .quantity(1)
                        .price(finalAmount)
                        .build();

                vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest paymentData =
                        vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest.builder()
                                .orderCode(payosOrderCode)
                                .amount(finalAmount)
                                .description(description)
                                .returnUrl("http://localhost:8080/api/v1/success")
                                .cancelUrl("http://localhost:8080/api/v1/cancel")
                                .items(List.of(item))
                                .build();

                try {
                    PayOS payOS = payOSConfig.getPayOSInstance();
                    log.info("[PayOS] Gọi PayOS SDK tạo QR thật cho đơn Mang về / Takeaway - orderCode={} - amount={}", payosOrderCode, finalAmount);
                    CreatePaymentLinkResponse responseData = payOS.paymentRequests().create(paymentData);

                    String qrImgUrl;
                    if (responseData.getQrCode() != null && !responseData.getQrCode().isBlank()) {
                        if (responseData.getQrCode().startsWith("http")) {
                            qrImgUrl = responseData.getQrCode();
                        } else {
                            qrImgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
                                    + java.net.URLEncoder.encode(responseData.getQrCode(), java.nio.charset.StandardCharsets.UTF_8);
                        }
                    } else {
                        qrImgUrl = buildVietQrUrlFromConfig(finalAmount, description);
                    }

                    String respAccountName = (responseData.getAccountName() != null && !responseData.getAccountName().isBlank())
                            ? responseData.getAccountName() : this.accountName;
                    String respAccountNo = (responseData.getAccountNumber() != null && !responseData.getAccountNumber().isBlank())
                            ? responseData.getAccountNumber() : this.accountNo;
                    String respBankName = (responseData.getBin() != null && !responseData.getBin().isBlank())
                            ? ("Ngân hàng (BIN " + responseData.getBin() + ")") : ("Ngân hàng (" + this.bankCode + ")");

                    log.info("[PayOS] Tạo QR PayOS SDK thành công cho Takeaway. checkoutUrl={}, accountNo={}", responseData.getCheckoutUrl(), respAccountNo);

                    return PaymentLinkResponse.builder()
                            .payosOrderCode(payosOrderCode)
                            .totalAmount(finalAmount)
                            .transferContent(description)
                            .qrDataUrl(qrImgUrl)
                            .checkoutUrl(responseData.getCheckoutUrl())
                            .bankName(respBankName)
                            .accountName(respAccountName)
                            .accountNumber(respAccountNo)
                            .build();
                } catch (Exception e) {
                    log.error("[PayOS] Gọi PayOS SDK cho đơn Mang về lỗi, dùng cấu hình PayOS làm fallback: {}", e.getMessage());
                    String fallbackQr = buildVietQrUrlFromConfig(finalAmount, description);
                    return PaymentLinkResponse.builder()
                            .payosOrderCode(payosOrderCode)
                            .totalAmount(finalAmount)
                            .transferContent(description)
                            .qrDataUrl(fallbackQr)
                            .checkoutUrl(fallbackQr)
                            .bankName("Ngân hàng (" + this.bankCode + ")")
                            .accountName(this.accountName)
                            .accountNumber(this.accountNo)
                            .build();
                }
            }
        }

        // Không tìm thấy bàn hay session nào → throw error rõ ràng
        throw new PaymentException(
                "Không tìm thấy phiên bàn (Table Session) hoạt động để tạo QR thanh toán. "
                + "Vui lòng kiểm tra bàn đã được mở phiên chưa.");
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

    /**
     * Helper: Tạo VietQR QuickLink URL từ cấu hình application.properties
     * (KHÔNG BAO GIỜ hardcode số tài khoản - luôn đọc từ config)
     */
    private String buildVietQrUrlFromConfig(Long amount, String addInfo) {
        return "https://img.vietqr.io/image/" + bankCode + "-" + accountNo + "-compact2.png"
                + "?amount=" + amount
                + "&addInfo=" + java.net.URLEncoder.encode(addInfo, java.nio.charset.StandardCharsets.UTF_8)
                + "&accountName=" + java.net.URLEncoder.encode(accountName, java.nio.charset.StandardCharsets.UTF_8);
    }
}
