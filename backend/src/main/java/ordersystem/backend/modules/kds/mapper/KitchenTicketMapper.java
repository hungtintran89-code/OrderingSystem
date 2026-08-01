package ordersystem.backend.modules.kds.mapper;

import ordersystem.backend.modules.kds.dto.response.KitchenTicketResponse;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import org.springframework.stereotype.Component;


@Component
public class KitchenTicketMapper {

    public KitchenTicketResponse toResponse(KitchenTicketEntity entity) {
        if (entity == null) return null;
        return KitchenTicketResponse.builder()
                .kitchenTicketId(entity.getKitchenTicketId())
                .orderId(entity.getOrderId())
                .orderItemId(entity.getOrderItemId())
                .tableNumber(entity.getTableNumber())
                .areaName(entity.getAreaName())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .quantity(entity.getQuantity())
                .note(entity.getNote())
                .station(entity.getStation())
                .status(entity.getStatus())
                .assignedCookId(entity.getAssignedCookId())
                .assignedCookName(entity.getAssignedCookName())
                .build();
    }

}
