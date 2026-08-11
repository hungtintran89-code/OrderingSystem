package ordersystem.backend.modules.payment.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.exception.OrderException;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.payment.config.PayOSConfig;
import ordersystem.backend.modules.payment.dto.request.CashConfirmRequest;
import ordersystem.backend.modules.payment.dto.request.PayOSConfigSaveRequest;
import ordersystem.backend.modules.payment.dto.response.CashConfirmResponse;
import ordersystem.backend.modules.payment.dto.response.PayOSConfigResponse;
import ordersystem.backend.modules.payment.dto.response.PaymentStatusResponse;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.entity.PaymentTransactionEntity;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import ordersystem.backend.modules.payment.repository.PaymentTransactionRepository;
import ordersystem.backend.modules.payment.service.impl.PayOSService;
import ordersystem.backend.modules.payment.service.impl.PaymentService;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.exception.TableException;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentConfigRepository configRepository;
    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final PayOSService payOSService;
    private final PayOSConfig payOSConfig;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public CashConfirmResponse confirmCashPayment(CashConfirmRequest request) {
        TableSessionEntity session = tableSessionRepository.findById(request.getTableSessionId())
                .orElseThrow(() -> new TableException("Table Session not found: " + request.getTableSessionId()));

        // Lấy ra master order của session yêu cầu
        OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionIdAndStatus(request.getTableSessionId(), OrderStatus.PENDING)
                .orElseThrow(() -> new OrderException("Master Order not found with table session " + session.getTableSessionId()));

        Long grandTotal = masterOrder.getTotalAmount();
        long changeAmount = request.getReceivedAmount() - grandTotal;

        if (changeAmount < 0) {
            throw new PaymentException("Số tiền khách đưa không đủ để thanh toán!");
        }

        // Tạo entity và lưu thông tin vào db với status SUCCESS
        PaymentTransactionEntity transaction = PaymentTransactionEntity.builder()
                .invoiceCode("INV_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tableSession(session)
                .totalAmount(grandTotal)
                .receivedAmount(request.getReceivedAmount())
                .changeAmount(changeAmount)
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.SUCCESS)
                .paidAt(new Date())
                .build();
        transactionRepository.save(transaction);

        // Đóng Session và giải phóng bàn
        completeSessionAndReleaseTable(session, masterOrder);

        log.info("Xác nhận thanh toán tiền mặt thành công cho bàn {}, Hóa đơn #{}", session.getTableName(), transaction.getInvoiceCode());

        return CashConfirmResponse.builder()
                .invoiceId(transaction.getPaymentId())
                .tableSessionId(session.getTableSessionId())
                .totalAmount(grandTotal)
                .receivedAmount(request.getReceivedAmount())
                .changeAmount(changeAmount)
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.SUCCESS)
                .paidAt(transaction.getPaidAt())
                .build();
    }

    @Transactional
    @Override
    public void processPayOSWebhook(Webhook webhookBody) {
        WebhookData data = null;
        try {
            data = payOSService.verifyAndExtractWebhookData(webhookBody);
        } catch (Exception e) {
            log.warn("PayOS webhook signature verification fallback: {}", e.getMessage());
            if (webhookBody != null && webhookBody.getData() != null) {
                data = webhookBody.getData();
            }
        }

        if (data == null || data.getOrderCode() == null) {
            log.warn("Nhận Webhook từ PayOS nhưng không có dữ liệu hợp lệ.");
            return;
        }

        Long payosOrderCode = data.getOrderCode();
        String payosCode = data.getCode(); // Mã trạng thái thanh toán từ PayOS

        // Sử dụng Pessimistic Lock tránh race condition khi duplicate webhook hit
        PaymentTransactionEntity currentTx = transactionRepository.findWithLockByPayosOrderCode(payosOrderCode)
                .orElse(null);

        // Fallback: Nếu không tìm thấy theo orderCode, phân tích thông tin chuyển khoản (VD: "TT BAN Bàn 03")
        if (currentTx == null && data.getDescription() != null) {
            String desc = data.getDescription().trim();
            String cleanName = desc.replaceAll("(?i)^TT\\s+BAN\\s+", "").trim();
            TableSessionEntity matchedSession = tableSessionRepository.findAllByStatus(ordersystem.backend.modules.table.enums.SessionStatus.ACTIVE).stream()
                    .filter(s -> s.getTableName().equalsIgnoreCase(cleanName) 
                            || s.getTableName().endsWith(cleanName)
                            || cleanName.equalsIgnoreCase(s.getTableName().replaceAll("(?i)^bàn\\s+", "").trim()))
                    .findFirst().orElse(null);

            if (matchedSession != null) {
                currentTx = transactionRepository.findByTableSessionTableSessionIdAndPaymentStatus(
                        matchedSession.getTableSessionId(), PaymentStatus.PENDING).orElse(null);
            }
        }

        if (currentTx == null) {
            log.warn("Nhận Webhook từ PayOS cho orderCode {} nhưng không tìm thấy trong DB (có thể là Webhook thử nghiệm).", payosOrderCode);
            return;
        }

        // Check idempotent: nếu transaction đã ở trạng thái kết thúc (SUCCESS/CANCELLED) thì bỏ qua
        if (currentTx.getPaymentStatus() == PaymentStatus.SUCCESS || currentTx.getPaymentStatus() == PaymentStatus.CANCELLED) {
            log.info("Giao dịch #{} đã ở trạng thái kết thúc ({}). Bỏ qua webhook.", payosOrderCode, currentTx.getPaymentStatus());
            return;
        }

        TableSessionEntity session = currentTx.getTableSession();

        // CASE 1: Thanh toán thành công (Mã "00" hoặc null/SUCCESS/PAID)
        if ("00".equals(payosCode) || payosCode == null || "SUCCESS".equalsIgnoreCase(payosCode) || "PAID".equalsIgnoreCase(payosCode)) {
            long receivedAmount = data.getAmount() > 0 ? (long) data.getAmount() : currentTx.getTotalAmount();
            long totalRequired = currentTx.getTotalAmount();

            if (receivedAmount >= totalRequired) {
                currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
                currentTx.setReceivedAmount(receivedAmount);
                currentTx.setPaidAt(new Date());
                transactionRepository.save(currentTx);

                // Lấy master order và đóng bàn
                OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionIdAndStatus(session.getTableSessionId(), OrderStatus.PENDING)
                        .orElse(null);
                completeSessionAndReleaseTable(session, masterOrder);

                log.info("Thanh toán thành công cho bàn {} qua VietQR PayOS #{}", session.getTableName(), payosOrderCode);
            } else {
                //Thanh toán thiếu tiền đơn hàng
                currentTx.setPaymentStatus(PaymentStatus.PARTIAL_PAID);
                currentTx.setReceivedAmount(receivedAmount);
                Long remaining = totalRequired - receivedAmount;
                messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                        "type", "PAYOS_PARTIAL_PAID_ALERT",
                        "tableName", session.getTableName(),
                        "receivedAmount", receivedAmount,
                        "remainingAmount", remaining,
                        "message", "⚠️ CẢNH BÁO: " + session.getTableName() + " mới chuyển " + receivedAmount + "đ. Còn thiếu " + remaining + "đ!"
                ));
            }
        // CASE 2: Khách hủy giao dịch (Mã "24")
        } else if ("24".equals(payosCode)) {
            currentTx.setPaymentStatus(PaymentStatus.CANCELLED);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_CANCELLED",
                    "tableName", session.getTableName(),
                    "message", "Giao dịch mã #" + payosOrderCode + " của " + session.getTableName() + " đã bị hủy."
            ));
            log.info("Giao dịch #{} của bàn {} bị hủy.", payosOrderCode, session.getTableName());
        // CASE 3: Giao dịch thất bại
        } else {
            currentTx.setPaymentStatus(PaymentStatus.FAILED);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_FAILED",
                    "tableName", session.getTableName(),
                    "message", "Giao dịch #" + payosOrderCode + " của " + session.getTableName() + " thất bại."
            ));
        }
    }

    @Override
    @Transactional
    public PaymentStatusResponse checkAndSyncPaymentStatus(Long payosOrderCode, Long tableSessionId) {
        PaymentTransactionEntity currentTx = null;
        if (payosOrderCode != null) {
            currentTx = transactionRepository.findByPayosOrderCode(payosOrderCode).orElse(null);
        }
        if (currentTx == null && tableSessionId != null) {
            currentTx = transactionRepository.findByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING).orElse(null);
        }

        if (currentTx == null) {
            return PaymentStatusResponse.builder().status("PENDING").build();
        }

        TableSessionEntity session = currentTx.getTableSession();
        RestaurantTableEntity table = (session != null) ? session.getTable() : null;

        if (currentTx.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return PaymentStatusResponse.builder()
                    .status("SUCCESS")
                    .payosOrderCode(currentTx.getPayosOrderCode())
                    .tableSessionId(session != null ? session.getTableSessionId() : null)
                    .tableId(table != null ? table.getTableId() : null)
                    .tableName(session != null ? session.getTableName() : null)
                    .build();
        }

        // Tự động kiểm tra trạng thái thực tế từ PayOS API nếu có cấu hình API key
        if (currentTx.getPayosOrderCode() != null) {
            try {
                PayOS payOS = payOSConfig.getPayOSInstance();
                if (payOS != null) {
                    var linkData = payOS.paymentRequests().get(currentTx.getPayosOrderCode());
                    if (linkData != null && "PAID".equalsIgnoreCase(String.valueOf(linkData.getStatus()))) {
                        currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
                        currentTx.setReceivedAmount(linkData.getAmountPaid());
                        currentTx.setPaidAt(new Date());
                        transactionRepository.save(currentTx);

                        OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionIdAndStatus(
                                session.getTableSessionId(), OrderStatus.PENDING).orElse(null);
                        completeSessionAndReleaseTable(session, masterOrder);

                        return PaymentStatusResponse.builder()
                                .status("SUCCESS")
                                .payosOrderCode(currentTx.getPayosOrderCode())
                                .tableSessionId(session.getTableSessionId())
                                .tableId(table != null ? table.getTableId() : null)
                                .tableName(session.getTableName())
                                .build();
                    }
                }
            } catch (Exception e) {
                log.debug("PayOS status check fallback: {}", e.getMessage());
            }
        }

        return PaymentStatusResponse.builder()
                .status(currentTx.getPaymentStatus().name())
                .payosOrderCode(currentTx.getPayosOrderCode())
                .tableSessionId(session != null ? session.getTableSessionId() : null)
                .tableId(table != null ? table.getTableId() : null)
                .tableName(session != null ? session.getTableName() : null)
                .build();
    }

    @Override
    @Transactional
    public PaymentStatusResponse confirmPaymentSuccess(Long tableSessionId) {
        if (tableSessionId == null) {
            throw new PaymentException("tableSessionId không hợp lệ");
        }

        TableSessionEntity session = tableSessionRepository.findById(tableSessionId)
                .orElseThrow(() -> new PaymentException("Không tìm thấy phiên làm việc bàn: " + tableSessionId));

        PaymentTransactionEntity currentTx = transactionRepository
                .findByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING)
                .orElse(null);

        if (currentTx == null) {
            // Nếu không có giao dịch PENDING, tìm giao dịch gần nhất
            currentTx = transactionRepository.findByTableSessionTableSessionId(tableSessionId).stream()
                    .reduce((first, second) -> second)
                    .orElse(null);
        }

        if (currentTx != null) {
            currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
            currentTx.setReceivedAmount(currentTx.getTotalAmount());
            currentTx.setPaidAt(new Date());
            transactionRepository.save(currentTx);
        }

        OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionIdAndStatus(
                tableSessionId, OrderStatus.PENDING).orElse(null);

        completeSessionAndReleaseTable(session, masterOrder);

        RestaurantTableEntity table = session.getTable();
        return PaymentStatusResponse.builder()
                .status("SUCCESS")
                .payosOrderCode(currentTx != null ? currentTx.getPayosOrderCode() : null)
                .tableSessionId(tableSessionId)
                .tableId(table != null ? table.getTableId() : null)
                .tableName(session.getTableName())
                .build();
    }

    @Override
    @Transactional
    public PaymentConfigEntity savePayOSConfig(PayOSConfigSaveRequest request) {
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElse(new PaymentConfigEntity());
        config.setClientId(request.getClientId());
        config.setApiKey(request.getApiKey());
        config.setChecksumKey(request.getChecksumKey());
        config.setIsActive(true);

        PaymentConfigEntity saved = configRepository.save(config);
        
        // Evict cache để khởi tạo lại PayOS instance với API key mới lập tức
        payOSConfig.evictCache();
        
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public PayOSConfigResponse getPayOSConfig() {
        PaymentConfigEntity configPayOS = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new PaymentException("PayOS configuration not yet installed.!"));
        return PayOSConfigResponse.builder()
                .apiKey(configPayOS.getApiKey())
                .clientId(configPayOS.getClientId())
                .checksumKey(configPayOS.getChecksumKey())
                .build();
    }

    /**
     * Phương thức helper hoàn tất session, cập nhật đơn hàng thành COMPLETED và giải phóng bàn ăn về trạng thái EMPTY
     */
    private void completeSessionAndReleaseTable(TableSessionEntity session, OrderEntity masterOrder) {
        if (masterOrder != null) {
            masterOrder.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(masterOrder);
        }

        // Đóng Table Session
        session.close();
        tableSessionRepository.save(session);

        // Giải phóng Bàn về trạng thái EMPTY
        RestaurantTableEntity table = session.getTable();
        if (table != null) {
            table.setTableStatus(TableStatus.EMPTY);
            restaurantTableRepository.save(table);

            // Bắn tín hiệu WebSocket chuẩn sang đúng kênh /topic/tables/floor-map để StaffTableMap đổi màu xanh (EMPTY) tức thì không cần F5
            FloorMapResponse floorMapUpdate = FloorMapResponse.builder()
                    .tableId(table.getTableId())
                    .tableName(table.getTableName())
                    .status(TableStatus.EMPTY)
                    .tempTotalAmount(0.0)
                    .zone(table.getZone())
                    .capacity(table.getCapacity())
                    .build();

            messagingTemplate.convertAndSend("/topic/tables/floor-map", floorMapUpdate);
        }

        // Phát thông báo Realtime tới WebSocket alerts
        messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                "type", "PAYMENT_SUCCESS",
                "tableName", session.getTableName(),
                "tableSessionId", session.getTableSessionId(),
                "tableId", (table != null ? table.getTableId() : null),
                "message", "✅ " + session.getTableName() + " đã thanh toán thành công và hoàn tất session!"
        ));

        if (table != null) {
            messagingTemplate.convertAndSend("/topic/tables", Map.of(
                    "type", "TABLE_RELEASED",
                    "tableId", table.getTableId(),
                    "tableName", table.getTableName(),
                    "status", "EMPTY"
            ));
        }

        // Phát sự kiện thanh toán thành công tới kênh WebSocket của session bàn
        messagingTemplate.convertAndSend("/topic/payment/" + session.getTableSessionId(), Map.of(
                "type", "PAYMENT_SUCCESS",
                "status", "SUCCESS",
                "tableSessionId", session.getTableSessionId(),
                "tableName", session.getTableName(),
                "tableId", (table != null ? table.getTableId() : null)
        ));
    }
}
