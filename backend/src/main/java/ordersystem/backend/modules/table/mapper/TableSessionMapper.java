package ordersystem.backend.modules.table.mapper;

import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.entity.TableSession;
import org.springframework.stereotype.Component;

@Component
public class TableSessionMapper {

    public QRResolveResponse toQRResolveResponse(TableSession tableSession, RestaurantTable tableInfo){
        if (tableSession == null){
            return null;
        }

        return QRResolveResponse.builder()
                .tableId(tableInfo.getTableId())
                .tableName(tableInfo.getTableName())
                .sessionId(tableSession.getTableSessionId())
                .sessionStatus(tableSession.getStatus().name())
                .build();
    }
}
