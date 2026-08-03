package ordersystem.backend.modules.table.event;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.enums.TableStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;


@Component
@RequiredArgsConstructor
public class TableEventListener {

    private final WebSocketPublisher messagingTemplate ;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTableStateChangeEvent(TableStateChangeEvent event) {

        FloorMapResponse response = FloorMapResponse.builder()
                .tableId(event.getTableId())
                .tableName(event.getTableName())
                .status(event.getNewStatus())
                .tempTotalAmount(0.0)
                .build();
        messagingTemplate.notifyFloorMapUpdate(response);
    }


}
