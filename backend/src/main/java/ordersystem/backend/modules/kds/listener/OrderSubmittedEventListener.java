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
    public void handleOrderSubmitted (OrderSubmittedEvent orderSubmittedEvent ){
        for ( OrderSubmittedEvent.OrderItemInfo item : orderSubmittedEvent.getItems() ){
            // 📌 CÔNG DỤNG: Tự động phân loại trạm bếp dựa vào Danh mục món
            KitchenTicketEntity ticket = KitchenTicketEntity.builder()
                    .orderId(orderSubmittedEvent.getOrderId())
                    .orderItemId(item.getOrderItemId())
                    .tableNumber(orderSubmittedEvent.getTableNumber())
                    .areaName(orderSubmittedEvent.getAreaName())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .quantity(item.getQuantity())
                    .note(item.getNote())
                    .status(KitchenItemStatus.PENDING) // Khởi tạo với trạng thái Chờ bếp nhận
                    .build();

            KitchenTicketEntity saved = kitchenTicketRepository.save(ticket) ;
            KitchenTicketResponse kitchenTicketResponse = kitchenTicketMapper.toResponse(saved) ;

            kitchenWebSocketPublisher.notifyKitchenOrders(kitchenTicketResponse);
        }
    }
}
