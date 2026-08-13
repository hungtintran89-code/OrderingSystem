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


    // Logic được xử lý tập trung chuẩn hóa tại OrderSubmittedEventListener.java
    // @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderSubmitted (OrderSubmittedEvent event) {
        // Handled centrally by OrderSubmittedEventListener
    }

}
