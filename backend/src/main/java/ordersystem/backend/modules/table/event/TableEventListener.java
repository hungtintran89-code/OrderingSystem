package ordersystem.backend.modules.table.event;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class TableEventListener {
    // SimpMessagingTemplate dùng để bắn tin nhắn ngầm qua kết nối WebSocket STOMP
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlTableStateChangeEvent(TableStateChangeEvent event){
        log.info("📢 [Event Triggered] Bàn '{}' (ID: {}) vừa chuyển sang trạng thái: {}",
                event.getTableName(), event.getTableId(), event.getNewStatus());

        // Bắn thông báo Real-time đến tất cả Client đang Subscribe kênh "/topic/tables/floor-map"
        messagingTemplate.convertAndSend("/topic/tables/floor-map", event);
    }
}
