package ordersystem.backend.modules.kds.listener;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.mapper.KitchenTicketMapper;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.order.event.OrderSubmittedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class OrderSubmittedEventListener {

    private final KitchenTicketRepository kitchenTicketRepository ;
    private final KitchenTicketMapper kitchenTicketMapper ;
    private final WebSocketPublisher kitchenWebSocketPublisher ;

    // 📌 CÔNG DỤNG: Tự động chạy HỨNG SỰ KIỆN CHỈ SAU KHỊ Order Module đã lưu DB thành công (AFTER_COMMIT)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void handleOrderSubmitted(OrderSubmittedEvent orderSubmittedEvent) {
        if (orderSubmittedEvent == null || orderSubmittedEvent.getItems() == null) return;

        for (OrderSubmittedEvent.OrderItemInfo item : orderSubmittedEvent.getItems()) {
            Long itemPk = item.getOrderItemId();
            if (itemPk == null) {
                itemPk = (System.currentTimeMillis() % 1000000000L) + (long)(Math.random() * 10000);
            }

            KitchenTicketEntity ticket = KitchenTicketEntity.builder()
                    .orderId(orderSubmittedEvent.getOrderId())
                    .orderItemId(itemPk)
                    .tableNumber(orderSubmittedEvent.getTableNumber() != null ? orderSubmittedEvent.getTableNumber() : "Bàn 01")
                    .areaName(orderSubmittedEvent.getAreaName() != null ? orderSubmittedEvent.getAreaName() : "Khu A")
                    .productId(item.getProductId())
                    .productName(item.getProductName() != null ? item.getProductName() : "Món ăn")
                    .quantity(item.getQuantity())
                    .note(item.getNote())
                    .status(KitchenItemStatus.PENDING)
                    .build();

            try {
                KitchenTicketEntity saved = kitchenTicketRepository.save(ticket);
                KitchenTicketResponse kitchenTicketResponse = kitchenTicketMapper.toResponse(saved);
                kitchenWebSocketPublisher.notifyKitchenOrders(kitchenTicketResponse);
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(OrderSubmittedEventListener.class)
                        .error("[KDS Listener] Lỗi lưu vé bếp cho orderId={}: {}", orderSubmittedEvent.getOrderId(), e.getMessage());
            }
        }
    }
}
