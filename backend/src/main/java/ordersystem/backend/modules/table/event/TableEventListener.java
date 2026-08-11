package ordersystem.backend.modules.table.event;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.websocket.WebSocketPublisher;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Optional;


@Component
@RequiredArgsConstructor
public class TableEventListener {

    private final WebSocketPublisher messagingTemplate;
    private final TableSessionRepository tableSessionRepository;
    private final OrderRepository orderRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTableStateChangeEvent(TableStateChangeEvent event) {
        Double tempAmount = 0.0;
        if (event.getNewStatus() != TableStatus.EMPTY) {
            Optional<TableSessionEntity> sessionOpt = tableSessionRepository
                    .findByTableTableIdAndStatus(event.getTableId(), SessionStatus.ACTIVE);
            if (sessionOpt.isPresent()) {
                List<OrderEntity> orders = orderRepository.findByTableSessionTableSessionIdInAndStatusNot(
                        List.of(sessionOpt.get().getTableSessionId()), OrderStatus.CANCELLED);
                tempAmount = orders.stream()
                        .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0)
                        .sum();
            }
        }

        FloorMapResponse response = FloorMapResponse.builder()
                .tableId(event.getTableId())
                .tableName(event.getTableName())
                .status(event.getNewStatus())
                .tempTotalAmount(tempAmount)
                .build();
        messagingTemplate.notifyFloorMapUpdate(response);
    }
}

