package ordersystem.backend.modules.table.mapper;

import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import org.springframework.stereotype.Component;

@Component
public class RestaurantTableMapper {

    public TableResponse toTableResponse(RestaurantTableEntity tableInfo){
        if (tableInfo == null){
            return null;
        }

        return TableResponse.builder()
                .tableId(tableInfo.getTableId())
                .tableName(tableInfo.getTableName())
                .qrToken(tableInfo.getQrToken())
                .qrUrl(tableInfo.getQrUrl())
                .qrImageBase64(tableInfo.getQrImageBase64())
                .zone(tableInfo.getZone() != null ? tableInfo.getZone() : "Tầng 1")
                .capacity(tableInfo.getCapacity() != null ? tableInfo.getCapacity() : 4)
                .isActive(tableInfo.getIsActive())
                .build();
    }
}
