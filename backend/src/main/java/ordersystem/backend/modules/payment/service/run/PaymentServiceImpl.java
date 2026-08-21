package ordersystem.backend.modules.payment.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
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
import org.springframework.cache.CacheManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import ordersystem.backend.modules.order.dto.request.OrderItemRequest;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.common.websocket.WebSocketPublisher;
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
    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final PaymentConfigRepository paymentConfigRepository;
    private final PaymentConfigRepository configRepository;
    private final KitchenTicketRepository kitchenTicketRepository;
    private final KitchenTicketMapper kitchenTicketMapper;
    private final WebSocketPublisher webSocketPublisher;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;
    private final PayOSConfig payOSConfig;
    private final PayOSService payOSService;
    private final SimpMessagingTemplate messagingTemplate;
    private final CacheManager cacheManager;

    @Override
    @Transactional
    public CashConfirmResponse confirmCashPayment(CashConfirmRequest request) {
        TableSessionEntity session = tableSessionRepository.findById(request.getTableSessionId())
                .orElseThrow(() -> new TableException("Table Session not found: " + request.getTableSessionId()));

        // Lấy ra tất cả các đơn hàng chưa bị CANCELLED của session yêu cầu
        List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(request.getTableSessionId(), OrderStatus.CANCELLED);
        if (sessionOrders.isEmpty()) {
            throw new OrderException("Master Order not found with table session " + session.getTableSessionId());
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
        completeSessionAndReleaseTable(session, sessionOrders);

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
        log.info("[PayOS Webhook] Bắt đầu xử lý Webhook từ PayOS...");
        WebhookData data = null;
        try {
            data = payOSService.verifyAndExtractWebhookData(webhookBody);
        } catch (Exception e) {
            log.warn("[PayOS Webhook] Signature verification fallback: {}", e.getMessage());
            if (webhookBody != null && webhookBody.getData() != null) {
                data = webhookBody.getData();
            }
        }

        if (data == null || data.getOrderCode() == null) {
            log.warn("[PayOS Webhook] Nhận Webhook từ PayOS nhưng data hoặc orderCode bị NULL.");
            return;
        }

        Long payosOrderCode = data.getOrderCode();
        String payosCode = data.getCode(); // Mã trạng thái từ PayOS ("00" là thành công)
        long amountFromPayOS = data.getAmount() > 0 ? (long) data.getAmount() : 0L;

        log.info("[PayOS Webhook] Thông tin nhận được: orderCode={}, amount={}, code={}, desc={}",
                payosOrderCode, amountFromPayOS, payosCode, data.getDescription());

        // 1. Tìm giao dịch theo payosOrderCode
        PaymentTransactionEntity currentTx = transactionRepository.findByPayosOrderCode(payosOrderCode)
                .orElse(null);

        if (currentTx == null && payosOrderCode != null) {
            currentTx = transactionRepository.findById(payosOrderCode).orElse(null);
        }

        // 2. Fallback cho Bàn Ăn nếu không thấy orderCode
        if (currentTx == null && data.getDescription() != null) {
            String desc = data.getDescription().trim();
            String cleanName = desc.replaceAll("(?i)^TT\\s+BAN\\s+", "").replaceAll("(?i)^bàn\\s+", "").trim();
            TableSessionEntity matchedSession = tableSessionRepository.findAllByStatus(ordersystem.backend.modules.table.enums.SessionStatus.ACTIVE).stream()
                    .filter(s -> {
                        String sName = s.getTableName().replaceAll("(?i)^bàn\\s+", "").trim();
                        return s.getTableName().equalsIgnoreCase(cleanName) 
                                || sName.equalsIgnoreCase(cleanName)
                                || desc.toUpperCase().contains(s.getTableName().toUpperCase())
                                || desc.toUpperCase().contains(sName.toUpperCase());
                    })
                    .findFirst().orElse(null);

            if (matchedSession != null) {
                currentTx = transactionRepository.findByTableSessionTableSessionIdAndPaymentStatus(
                        matchedSession.getTableSessionId(), PaymentStatus.PENDING).orElse(null);
                if (currentTx == null) {
                    currentTx = transactionRepository.findByTableSessionTableSessionId(matchedSession.getTableSessionId()).stream()
                            .reduce((first, second) -> second).orElse(null);
                }
            }
        }

        // 3. Fallback cho Đơn Mang Về (Takeaway) nếu không thấy orderCode
        if (currentTx == null && data.getDescription() != null) {
            String upperDesc = data.getDescription().trim().toUpperCase();
            if (upperDesc.contains("MANG VE") || upperDesc.contains("MANGVE") || upperDesc.contains("TAKEAWAY")) {
                currentTx = transactionRepository.findAll().stream()
                        .filter(t -> "TAKEAWAY".equalsIgnoreCase(t.getOrderType()) && t.getPaymentStatus() == PaymentStatus.PENDING)
                        .reduce((first, second) -> second).orElse(null);
                if (currentTx == null) {
                    currentTx = transactionRepository.findAll().stream()
                            .filter(t -> "TAKEAWAY".equalsIgnoreCase(t.getOrderType()))
                            .reduce((first, second) -> second).orElse(null);
                }
            }
        }

        if (currentTx == null) {
            log.warn("[PayOS Webhook] KHÔNG TÌM THẤY Transaction trong DB cho orderCode={} hoặc desc={}", payosOrderCode, data.getDescription());
            return;
        }

        // Check idempotent: nếu transaction đã ở trạng thái kết thúc (SUCCESS) thì vẫn bắn WebSocket để đảm bảo UI nhận
        if (currentTx.getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("[PayOS Webhook] Giao dịch #{} đã ở trạng thái SUCCESS. Bắn lại tín hiệu WebSocket cho UI.", payosOrderCode);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_SUCCESS",
                    "status", "SUCCESS",
                    "payosOrderCode", payosOrderCode,
                    "tableName", "Mang Về",
                    "message", "✅ Đã xác nhận thanh toán qua VietQR cho Đơn Mang Về!"
            ));
            messagingTemplate.convertAndSend("/topic/admin/orders", Map.of(
                    "type", "ORDER_PAYMENT_SUCCESS",
                    "status", "SUCCESS",
                    "payosOrderCode", payosOrderCode,
                    "tableName", "Mang Về"
            ));
            return;
        }

        TableSessionEntity session = currentTx.getTableSession();
        long totalRequired = currentTx.getTotalAmount() != null ? currentTx.getTotalAmount() : 0L;
        long receivedAmount = amountFromPayOS > 0 ? amountFromPayOS : totalRequired;

        // CASE 1: Thanh toán thành công (Mã "00" hoặc null/SUCCESS/PAID)
        if ("00".equals(payosCode) || payosCode == null || "SUCCESS".equalsIgnoreCase(payosCode) || "PAID".equalsIgnoreCase(payosCode)) {
            if (receivedAmount >= totalRequired || totalRequired == 0L) {
                currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
                currentTx.setReceivedAmount(receivedAmount);
                currentTx.setPaidAt(new Date());
                transactionRepository.save(currentTx);

                if (session != null) {
                    // Lấy tất cả đơn hàng chưa bị CANCELLED và đóng bàn
                    List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                            session.getTableSessionId(), OrderStatus.CANCELLED);
                    completeSessionAndReleaseTable(session, sessionOrders);
                } else {
                    // Đối với Đơn Mang Về (Takeaway): TỰ ĐỘNG KHỞI TẠO VÀ LƯU CSDL VÀ PHÁT WEBSOCKET KDS + DOANH THU + ORDER LIST
                    processTakeawayOrderSuccess(currentTx, receivedAmount);
                }

                log.info("[PayOS Webhook] Xử lý THÀNH CÔNG cho {} qua VietQR PayOS #{}", (session != null ? session.getTableName() : "Mang Về"), payosOrderCode);
            } else {
                // Thanh toán thiếu tiền đơn hàng
                currentTx.setPaymentStatus(PaymentStatus.PARTIAL_PAID);
                currentTx.setReceivedAmount(receivedAmount);
                Long remaining = totalRequired - receivedAmount;
                messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                        "type", "PAYOS_PARTIAL_PAID_ALERT",
                        "tableName", (session != null ? session.getTableName() : "Mang Về"),
                        "receivedAmount", receivedAmount,
                        "remainingAmount", remaining,
                        "message", "⚠️ CẢNH BÁO: Đơn mới chuyển " + receivedAmount + "đ. Còn thiếu " + remaining + "đ!"
                ));
            }
        // CASE 2: Khách hủy giao dịch (Mã "24")
        } else if ("24".equals(payosCode)) {
            currentTx.setPaymentStatus(PaymentStatus.CANCELLED);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_CANCELLED",
                    "tableName", session != null ? session.getTableName() : "Mang Về",
                    "message", "Giao dịch mã #" + payosOrderCode + " của " + (session != null ? session.getTableName() : "Mang Về") + " đã bị hủy."
            ));
            log.info("Giao dịch #{} của bàn {} bị hủy.", payosOrderCode, session != null ? session.getTableName() : "Mang Về");
        // CASE 3: Giao dịch thất bại
        } else {
            currentTx.setPaymentStatus(PaymentStatus.FAILED);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_FAILED",
                    "tableName", session != null ? session.getTableName() : "Mang Về",
                    "message", "Giao dịch #" + payosOrderCode + " của " + (session != null ? session.getTableName() : "Mang Về") + " thất bại."
            ));
        }
    }

    @Override
    @Transactional
    public PaymentStatusResponse checkAndSyncPaymentStatus(Long payosOrderCode, Long tableSessionId) {
        // 1. Kiểm tra nhanh xem Session bàn đã CLOSED hay chưa
        if (tableSessionId != null) {
            TableSessionEntity session = tableSessionRepository.findById(tableSessionId).orElse(null);
            if (session != null && session.getStatus() == ordersystem.backend.modules.table.enums.SessionStatus.CLOSED) {
                RestaurantTableEntity table = session.getTable();
                return PaymentStatusResponse.builder()
                        .status("SUCCESS")
                        .payosOrderCode(payosOrderCode)
                        .tableSessionId(tableSessionId)
                        .tableId(table != null ? table.getTableId() : null)
                        .tableName(session.getTableName())
                        .build();
            }
        }

        PaymentTransactionEntity currentTx = null;
        if (payosOrderCode != null) {
            currentTx = transactionRepository.findByPayosOrderCode(payosOrderCode).orElse(null);
        }
        if (currentTx == null && tableSessionId != null) {
            currentTx = transactionRepository.findByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING).orElse(null);
        }
        if (currentTx == null && tableSessionId != null) {
            currentTx = transactionRepository.findByTableSessionTableSessionId(tableSessionId).stream()
                    .reduce((first, second) -> second).orElse(null);
        }
        if (currentTx == null && tableSessionId == null) {
            currentTx = transactionRepository.findAll().stream()
                    .filter(t -> "TAKEAWAY".equalsIgnoreCase(t.getOrderType()))
                    .reduce((first, second) -> second).orElse(null);
        }

        if (currentTx == null) {
            return PaymentStatusResponse.builder().status("PENDING").build();
        }

        TableSessionEntity session = currentTx.getTableSession();
        if (currentTx.getOrderType() != null && "TAKEAWAY".equalsIgnoreCase(currentTx.getOrderType())) {
            session = null;
        }
        RestaurantTableEntity table = (session != null) ? session.getTable() : null;

        if (currentTx.getPaymentStatus() == PaymentStatus.SUCCESS) {
            // Đảm bảo session & đơn hàng được đóng dứt điểm
            if (session != null && session.getStatus() == ordersystem.backend.modules.table.enums.SessionStatus.ACTIVE) {
                List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                        session.getTableSessionId(), OrderStatus.CANCELLED);
                completeSessionAndReleaseTable(session, sessionOrders);
            } else if (session == null) {
                processTakeawayOrderSuccess(currentTx, currentTx.getReceivedAmount() != null ? currentTx.getReceivedAmount() : currentTx.getTotalAmount());
            }

            return PaymentStatusResponse.builder()
                    .status("SUCCESS")
                    .payosOrderCode(currentTx.getPayosOrderCode())
                    .tableSessionId(session != null ? session.getTableSessionId() : null)
                    .tableId(table != null ? table.getTableId() : null)
                    .tableName(session != null ? session.getTableName() : "Mang Về")
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

                        if (session != null) {
                            List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                                    session.getTableSessionId(), OrderStatus.CANCELLED);
                            completeSessionAndReleaseTable(session, sessionOrders);
                        } else {
                            processTakeawayOrderSuccess(currentTx, linkData.getAmountPaid());
                        }

                        return PaymentStatusResponse.builder()
                                .status("SUCCESS")
                                .payosOrderCode(currentTx.getPayosOrderCode())
                                .tableSessionId(session != null ? session.getTableSessionId() : null)
                                .tableId(table != null ? table.getTableId() : null)
                                .tableName(session != null ? session.getTableName() : "Mang Về")
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
                .tableName(session != null ? session.getTableName() : "Mang Về")
                .build();
    }

    @Override
    @Transactional
    public PaymentStatusResponse confirmPaymentSuccess(Long tableSessionId) {
        return confirmPaymentSuccess(tableSessionId, null);
    }

    @Override
    @Transactional
    public PaymentStatusResponse confirmPaymentSuccess(Long tableSessionId, Long payosOrderCode) {
        if (tableSessionId == null && payosOrderCode == null) {
            throw new PaymentException("Thông tin xác nhận thanh toán không hợp lệ!");
        }

        PaymentTransactionEntity currentTx = null;
        if (payosOrderCode != null) {
            currentTx = transactionRepository.findByPayosOrderCode(payosOrderCode).orElse(null);
        }
        if (currentTx == null && tableSessionId != null) {
            currentTx = transactionRepository
                    .findByTableSessionTableSessionIdAndPaymentStatus(tableSessionId, PaymentStatus.PENDING)
                    .orElse(null);
        }
        if (currentTx == null && tableSessionId != null) {
            currentTx = transactionRepository.findByTableSessionTableSessionId(tableSessionId).stream()
                    .reduce((first, second) -> second)
                    .orElse(null);
        }

        if (currentTx == null) {
            throw new PaymentException("Không tìm thấy giao dịch thanh toán để xác nhận!");
        }

        TableSessionEntity session = currentTx.getTableSession();
        if (currentTx.getOrderType() != null && "TAKEAWAY".equalsIgnoreCase(currentTx.getOrderType())) {
            session = null;
        }

        currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
        currentTx.setReceivedAmount(currentTx.getTotalAmount() != null ? currentTx.getTotalAmount() : 0L);
        if (currentTx.getPaidAt() == null) currentTx.setPaidAt(new Date());
        transactionRepository.save(currentTx);

        if (session != null) {
            List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                    session.getTableSessionId(), OrderStatus.CANCELLED);
            completeSessionAndReleaseTable(session, sessionOrders);
            RestaurantTableEntity table = session.getTable();
            return PaymentStatusResponse.builder()
                    .status("SUCCESS")
                    .payosOrderCode(currentTx.getPayosOrderCode())
                    .tableSessionId(session.getTableSessionId())
                    .tableId(table != null ? table.getTableId() : null)
                    .tableName(session.getTableName())
                    .build();
        } else {
            processTakeawayOrderSuccess(currentTx, currentTx.getReceivedAmount() != null ? currentTx.getReceivedAmount() : currentTx.getTotalAmount());
            return PaymentStatusResponse.builder()
                    .status("SUCCESS")
                    .payosOrderCode(currentTx.getPayosOrderCode())
                    .tableName("Mang Về")
                    .build();
        }
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
    private void completeSessionAndReleaseTable(TableSessionEntity session, List<OrderEntity> sessionOrders) {
        // Xóa Cache Redis / Spring Cache cho sơ đồ bàn để API floor-map trả về dữ liệu mới nhất
        try {
            org.springframework.cache.Cache floorMapCache = cacheManager.getCache("floor_map");
            if (floorMapCache != null) {
                floorMapCache.clear();
            }
        } catch (Exception e) {
            log.warn("Lỗi khi xóa cache floor_map: {}", e.getMessage());
        }

        PaymentTransactionEntity tx = transactionRepository.findByTableSessionTableSessionId(session.getTableSessionId()).stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatus.SUCCESS)
                .findFirst()
                .orElse(null);

        if (sessionOrders != null && !sessionOrders.isEmpty()) {
            String resolvedMethod = (tx != null && tx.getPaymentMethod() != null)
                    ? tx.getPaymentMethod().name()
                    : "VIETQR";

            for (OrderEntity order : sessionOrders) {
                order.setStatus(OrderStatus.COMPLETED);
                order.setPaymentStatus("PAID");
                order.setPaymentMethod(resolvedMethod);
            }
            orderRepository.saveAll(sessionOrders);
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

        // Phát thông báo Realtime tới WebSocket alerts & Admin Order list
        messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                "type", "PAYMENT_SUCCESS",
                "status", "SUCCESS",
                "tableName", session.getTableName(),
                "tableSessionId", session.getTableSessionId(),
                "tableId", (table != null ? table.getTableId() : null),
                "payosOrderCode", (tx != null && tx.getPayosOrderCode() != null ? tx.getPayosOrderCode() : 0L),
                "message", "✅ " + session.getTableName() + " đã thanh toán thành công và hoàn tất session!"
        ));

        messagingTemplate.convertAndSend("/topic/admin/orders", Map.of(
                "type", "ORDER_PAYMENT_SUCCESS",
                "tableSessionId", session.getTableSessionId(),
                "tableName", session.getTableName()
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

    /**
     * Helper: Khởi tạo Đơn Mang Về (Takeaway Order), lưu DB, tạo vé bếp KDS và phát sự kiện WebSocket Realtime
     */
    private OrderEntity processTakeawayOrderSuccess(PaymentTransactionEntity currentTx, long receivedAmount) {
        OrderEntity takeawayOrder = null;
        if (currentTx.getOrderId() != null) {
            takeawayOrder = orderRepository.findById(currentTx.getOrderId()).orElse(null);
        }

        if (takeawayOrder == null) {
            List<OrderItemEntity> orderItems = new ArrayList<>();
            if (currentTx.getItemsJson() != null && !currentTx.getItemsJson().isBlank()) {
                try {
                    List<OrderItemRequest> itemReqs = objectMapper.readValue(
                            currentTx.getItemsJson(),
                            new TypeReference<List<OrderItemRequest>>() {}
                    );
                    if (itemReqs != null) {
                        for (OrderItemRequest req : itemReqs) {
                            ProductEntity p = productRepository.findById(req.getProductId()).orElse(null);
                            if (p != null) {
                                OrderItemEntity itemEntity = OrderItemEntity.builder()
                                        .product(p)
                                        .quantity(req.getQuantity())
                                        .price(p.getProductPrice())
                                        .note(req.getNote())
                                        .createdByThread(1L)
                                        .build();
                                orderItems.add(itemEntity);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("[PayOS] Lỗi đọc itemsJson cho Takeaway Order: {}", e.getMessage());
                }
            }

            takeawayOrder = OrderEntity.builder()
                    .orderCode("ORD-TV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .orderType("TAKEAWAY")
                    .paymentMethod("VIETQR")
                    .paymentStatus("PAID")
                    .status(OrderStatus.COMPLETED)
                    .totalAmount(receivedAmount > 0 ? receivedAmount : currentTx.getTotalAmount())
                    .items(new ArrayList<>())
                    .build();

            for (OrderItemEntity item : orderItems) {
                item.setOrder(takeawayOrder);
            }
            takeawayOrder.setItems(orderItems);

            takeawayOrder = orderRepository.saveAndFlush(takeawayOrder);
            currentTx.setOrderId(takeawayOrder.getId());
            currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
            currentTx.setReceivedAmount(receivedAmount > 0 ? receivedAmount : currentTx.getTotalAmount());
            if (currentTx.getPaidAt() == null) currentTx.setPaidAt(new Date());
            transactionRepository.save(currentTx);

            // 1. Tạo vé bếp KitchenTicketEntity & phát WebSocket xuống Bếp KDS
            if (takeawayOrder.getItems() != null && !takeawayOrder.getItems().isEmpty()) {
                for (OrderItemEntity item : takeawayOrder.getItems()) {
                    KitchenTicketEntity ticket = KitchenTicketEntity.builder()
                            .orderId(takeawayOrder.getId())
                            .orderItemId(item.getOrderItemId())
                            .tableNumber("Mang Về")
                            .areaName("Mang Về")
                            .productId(item.getProduct().getProductId())
                            .productName(item.getProduct().getProductName())
                            .quantity(item.getQuantity())
                            .note(item.getNote())
                            .status(KitchenItemStatus.PENDING)
                            .build();
                    try {
                        KitchenTicketEntity savedTicket = kitchenTicketRepository.save(ticket);
                        KitchenTicketResponse ticketResponse = kitchenTicketMapper.toResponse(savedTicket);
                        webSocketPublisher.notifyKitchenOrders(ticketResponse);
                    } catch (Exception e) {
                        log.error("[PayOS] Lỗi tạo vé bếp cho takeawayOrderId={}: {}", takeawayOrder.getId(), e.getMessage());
                    }
                }
            }
        }

        // 2. Phát thông báo Realtime cho Danh sách Đơn hàng & Doanh thu
        try {
            webSocketPublisher.notifyAdminOrdersUpdate(takeawayOrder);
        } catch (Exception ignored) {}

        Long payosCode = currentTx.getPayosOrderCode() != null ? currentTx.getPayosOrderCode() : 0L;

        // 3. Phát tín hiệu WebSocket cho POS Modal hiển thị xanh & tự đóng
        messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                "type", "PAYMENT_SUCCESS",
                "status", "SUCCESS",
                "payosOrderCode", payosCode,
                "tableName", "Mang Về",
                "message", "✅ Đã nhận thanh toán " + (takeawayOrder.getTotalAmount()) + "đ qua VietQR cho Đơn Mang Về!"
        ));

        messagingTemplate.convertAndSend("/topic/admin/orders", Map.of(
                "type", "ORDER_PAYMENT_SUCCESS",
                "status", "SUCCESS",
                "payosOrderCode", payosCode,
                "tableName", "Mang Về"
        ));

        return takeawayOrder;
    }
}

