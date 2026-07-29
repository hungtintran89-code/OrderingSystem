package ordersystem.backend.modules.order.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class WebSocketPublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Async
    public void notifyKitchenNewOrder(Object orderData) {
        messagingTemplate.convertAndSend("/topic/kitchen/orders", orderData);
    }

    @Async
    public void notifyAdminTableUpdate(Long tableSessionId, Object masterOrderData) {
        messagingTemplate.convertAndSend("/topic/admin/tables/" + tableSessionId, masterOrderData);
    }

    @Async
    public void notifyClientOrderStatusUpdate(String threadId, Object statusData) {
        messagingTemplate.convertAndSend("/topic/client/" + threadId, statusData);
    }
}
