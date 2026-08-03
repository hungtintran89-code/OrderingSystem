package ordersystem.backend.common.advice;

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

    // Bắn thông báo cập nhật giỏ hàng Real-time cho TOÀN BỘ các máy cùng bàn (cùng tableSessionId)
    @Async
    public void notifyCartUpdate(Long tableSessionId, Object cartData) {
        // Tất cả thiết bị subscribe kênh "/topic/cart/session/{tableSessionId}" sẽ nhận được dữ liệu giỏ hàng mới
        messagingTemplate.convertAndSend("/topic/cart/session/" + tableSessionId, cartData);
    }
}
