package ordersystem.backend.modules.kds.websocket;


import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KitchenWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate; // 📌 CÔNG DỤNG: Spring Helper class dùng gửi message tới Broker


    @Async
    public void broadcastToAllKitchenScreens( KitchenTicketResponse kitchenTicketResponse ){
        messagingTemplate.convertAndSend("/topic/kitchen/orders", kitchenTicketResponse);
    }

}
