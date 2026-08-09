package ordersystem.backend.modules.kds.listener;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.repository.KitchenTicketRepository;
import ordersystem.backend.modules.order.event.OrderSubmittedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.ArrayList;
import java.util.List;


@Component
@RequiredArgsConstructor
public class OrderEventListener {

    final private WebSocketPublisher webSocketPublisher ;
    final private KitchenTicketRepository kitchenTicketRepository ;


    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional( propagation = Propagation.REQUIRES_NEW)
    public void handleOrderSubmitted (OrderSubmittedEvent event) {
        List<KitchenTicketEntity> ticketToSave = new ArrayList<>();
        for (OrderSubmittedEvent.OrderItemInfo itemInfo : event.getItems()) {
            KitchenTicketEntity ticket = KitchenTicketEntity.builder()
                    .orderId(event.getOrderId())
                    .orderItemId(itemInfo.getOrderItemId())
                    .productId(itemInfo.getProductId())
                    .tableNumber(event.getTableNumber())
                    .areaName(event.getAreaName())
                    .productName(itemInfo.getProductName())
                    .quantity((long) itemInfo.getQuantity())
                    .note(itemInfo.getNote())
                    .status(KitchenItemStatus.PENDING)
                    .build();
            ticketToSave.add(ticket);
        }
        // 1. Lưu vé vào CSDL Bếp
        List<KitchenTicketEntity> savedTickets = kitchenTicketRepository.saveAll(ticketToSave);
        // 2. Bắn WebSocket cho Bếp CHẮC CHẮN sau khi Đơn hàng chính đã COMMIT thành công
        webSocketPublisher.notifyKitchenOrders(savedTickets);

    }

}
