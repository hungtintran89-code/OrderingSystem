package ordersystem.backend.modules.table.event;

import lombok.Getter;
import ordersystem.backend.modules.table.enums.TableStatus;
import org.springframework.context.ApplicationEvent;

@Getter
public class TableStateChangeEvent extends ApplicationEvent {
    private final Long tableId;
    private final String tableName;
    private final TableStatus newStatus;

    public TableStateChangeEvent(Object source, Long tableId, String tableName, TableStatus newStatus) {
        super(source);
        this.tableId = tableId;
        this.tableName = tableName;
        this.newStatus = newStatus;
    }
}
