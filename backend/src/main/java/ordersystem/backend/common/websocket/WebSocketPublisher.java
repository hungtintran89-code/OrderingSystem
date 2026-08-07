package ordersystem.backend.common.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class WebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    // 1. Thông báo Bếp (KDS) có đơn/món mới
    @Async
    public void notifyKitchenOrders(Object data) {
        messagingTemplate.convertAndSend("/topic/kitchen/orders", data);
    }

    // 2. Thông báo Lịch sử hoàn thành Bếp
    @Async
    public void notifyKitchenCompletedHistory(Object data) {
        messagingTemplate.convertAndSend("/topic/kitchen/completed-history", data);
    }

    // 3. Cập nhật Sơ đồ bàn Sống (Floor Map) cho Thu ngân/Phục vụ
    @Async
    public void notifyFloorMapUpdate(Object data) {
        messagingTemplate.convertAndSend("/topic/tables/floor-map", data);
    }

    // 4. Thông báo Trạng thái đơn về cho Điện thoại của Khách
    @Async
    public void notifyClientOrderStatus(String sessionToken, Object statusData) {
        messagingTemplate.convertAndSend("/topic/client/" + sessionToken, statusData);
    }

    // 5. Cập nhật Giỏ hàng real-time
    @Async
    public void notifyCartUpdate(Long tableSessionId, Object cartData) {
        messagingTemplate.convertAndSend("/topic/cart/session/" + tableSessionId, cartData);
    }

    // 6. Thông báo Khách gọi Phục vụ / Gọi thanh toán
    @Async
    public void notifyServiceRequest(Object requestData) {
        messagingTemplate.convertAndSend("/topic/admin/service-requests", requestData);
    }
}