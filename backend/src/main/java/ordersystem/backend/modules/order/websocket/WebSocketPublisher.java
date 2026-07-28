package ordersystem.backend.modules.order.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;

public class WebSocketPublisher {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. Phát tin báo Món mới xuống Màn hình Bếp (KDS)
    @Async
    public void notifyKitchenNewOrder(Object orderData) {
        messagingTemplate.convertAndSend("/topic/kitchen/orders", orderData);
    }

    // 2. Phát tin báo Cập nhật TAB CHUNG sang Màn hình Nhân viên (POS)
    @Async
    public void notifyAdminTableUpdate(String tableSessionId, Object masterOrderData) {
        messagingTemplate.convertAndSend("/topic/admin/tables/" + tableSessionId, masterOrderData);
    }

    // 3. Phát tin báo Bếp làm xong món về Điện thoại Khách
    @Async
    public void notifyClientOrderStatusUpdate(String threadId, Object statusData) {
        messagingTemplate.convertAndSend("/topic/client/" + threadId, statusData);
    }

}
