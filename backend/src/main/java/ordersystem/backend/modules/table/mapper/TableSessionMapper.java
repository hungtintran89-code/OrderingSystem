package ordersystem.backend.modules.table.mapper;

import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import org.springframework.stereotype.Component;

@Component
public class TableSessionMapper {

    public QRResolveResponse toQRResolveResponse(TableSessionEntity tableSessionEntity, RestaurantTableEntity tableInfo){
        if (tableSessionEntity == null){
            return null;
        }

        return QRResolveResponse.builder()
                .tableId(tableInfo.getTableId())
                .tableName(tableInfo.getTableName())
                .sessionId(tableSessionEntity.getTableSessionId())
                .sessionStatus(tableSessionEntity.getStatus().name())
                .build();
    }
}
