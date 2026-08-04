package ordersystem.backend.modules.payment.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.payment.dto.request.CashConfirmRequest;
import ordersystem.backend.modules.payment.dto.request.PayOSConfigSaveRequest;
import ordersystem.backend.modules.payment.dto.response.CashConfirmResponse;
import ordersystem.backend.modules.payment.dto.response.PayOSConfigResponse;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.entity.PaymentTransactionEntity;
import ordersystem.backend.modules.payment.enums.PaymentMethod;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import ordersystem.backend.modules.payment.repository.PaymentTransactionRepository;
import ordersystem.backend.modules.payment.service.impl.PayOSService;
import ordersystem.backend.modules.payment.service.impl.PaymentService;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.exception.TableException;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentConfigRepository configRepository;
    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final PayOSService payOSService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public CashConfirmResponse confirmCashPayment(CashConfirmRequest request){
        TableSessionEntity session = tableSessionRepository.findById(request.getTableSessionId())
            .orElseThrow( () -> new TableException("Table Session not found"));

        //Lấy ra master order của session yêu cầu
        OrderEntity masterOrder = orderRepository.findByTableSessionTableSessionId(request.getTableSessionId())
                .orElseThrow( () -> OrderException("Master Order not found with table session " +  session.getTableSessionId()));

        Long grandTotal = masterOrder.getTotalAmount();

        long changeAmount = request.getReceivedAmount() - grandTotal;

        //Tạo entity và lưu thông tin vào db với status success
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
        //completeSessionAndReleaseTable(session, allOrders);

        //Trả về response cho controller
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
    public void processPayOSWebhook(Webhook webhookBody){
        WebhookData data = payOSService.verifyAndExtractWebhookData(webhookBody);
        Long payosOrderCode = data.getOrderCode();
        String payosCode = data.getCode();

        //Thông tin lần thanh toán hiện tại
        PaymentTransactionEntity currentTx = transactionRepository.findByPayosOrderCode(payosOrderCode)
            .orElseThrow( () -> new PaymentException("Transaction with PayOS OrderCode " + payosOrderCode + " not found"));

        //Nếu ở lần thanh toán này có status (SUCCESS/CANCELLED) thì return tránh trùng lặp
        if (currentTx.getPaymentStatus() == PaymentStatus.SUCCESS || currentTx.getPaymentStatus() == PaymentStatus.CANCELLED){
            log.info("Lần thử thanh toán {} đã ở trạng thái kết thúc ({}). Ignore webhook.", payosOrderCode, currentTx.getPaymentStatus());
            return;
        }

        TableSessionEntity session = currentTx.getTableSession();
        // ---------------------------------------------------------------------
        // CASE 1: Lần thử thanh toán NÀY THÀNH CÔNG (Mã "00") (Trạng thái: Đủ tiền hoặc thiếu tiền)
        // ---------------------------------------------------------------------
        if ("00".equals(payosCode)) {
            long receivedAmount = (long) data.getAmount();
            long totalRequired = currentTx.getTotalAmount();
            if (receivedAmount >= totalRequired) {
                // Đánh dấu Lần thử này SUCCESS
                currentTx.setPaymentStatus(PaymentStatus.SUCCESS);
                currentTx.setReceivedAmount(receivedAmount);
                currentTx.setPaidAt(new Date());
                // Đóng Session & Mở Bàn trống
                List<OrderEntity> allOrders = orderRepository.findByTableSessionTableSessionId(session.getTableSessionId());
                //completeSessionAndReleaseTable(session, allOrders);
                log.info("Thanh toán thành công cho bàn {} qua Lượt giao dịch #{}", session.getTableName(), payosOrderCode);
            } else {
                // Thiếu tiền
                currentTx.setPaymentStatus(PaymentStatus.PARTIAL_PAID);
                currentTx.setReceivedAmount(receivedAmount);
                long remaining = totalRequired - receivedAmount;
                messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                        "type", "PAYOS_PARTIAL_PAID_ALERT",
                        "tableName", session.getTableName(),
                        "receivedAmount", receivedAmount,
                        "remainingAmount", remaining,
                        "message", "⚠️ CẢNH BÁO: " + session.getTableName() + " mới chuyển " + receivedAmount + "đ. Còn thiếu " + remaining + "đ!"
                ));
            }
            // ---------------------------------------------------------------------
            // CASE 2: Khách bấm HỦY trên trang PayOS (Mã "24")
            // ---------------------------------------------------------------------
        } else if ("24".equals(payosCode)) {
            // Chỉ đánh dấu LẦN THỬ NÀY bị CANCELLED
            currentTx.setPaymentStatus(PaymentStatus.CANCELLED);
            transactionRepository.save(currentTx);
            // Bàn 05 VẪN ĐANG OCCUPIED, Session VẪN ACTIVE -> Thu ngân có thể bấm "Tạo lại mã QR" bất kỳ lúc nào!
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_CANCELLED",
                    "tableName", session.getTableName(),
                    "message", "Lần thử thanh toán mã #" + payosOrderCode + " của " + session.getTableName() + " đã bị hủy."
            ));
            log.info("Lần thử thanh toán #{} của bàn {} bị hủy.", payosOrderCode, session.getTableName());
            // ---------------------------------------------------------------------
            // CASE 3: Giao dịch Lỗi
            // ---------------------------------------------------------------------
        } else {
            currentTx.setPaymentStatus(PaymentStatus.FAILED);
            messagingTemplate.convertAndSend("/topic/admin/tables/alerts", Map.of(
                    "type", "PAYMENT_FAILED",
                    "tableName", session.getTableName(),
                    "message", "Lần thử thanh toán #" + payosOrderCode + " của " + session.getTableName() + " thất bại."
            ));
        }

    }

    @Override
    public PaymentConfigEntity savePayOSConfig(PayOSConfigSaveRequest request) {
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElse(new PaymentConfigEntity());
        config.setClientId(request.getClientId());
        config.setApiKey(request.getApiKey());
        config.setChecksumKey(request.getChecksumKey());
        config.setIsActive(true);
        return configRepository.save(config);
    }
    @Override
    public PayOSConfigResponse getPayOSConfig() {
        PaymentConfigEntity configPayOS = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new PaymentException("PayOS configuration not yet installed.!"));
        return PayOSConfigResponse.builder()
                .apiKey(configPayOS.getApiKey())
                .clientId(configPayOS.getClientId())
                .checksumKey(configPayOS.getChecksumKey())
                .build();
    }
}
