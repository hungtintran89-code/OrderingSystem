package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.entity.OrderItemEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderMapper {

    public OrderItemResponse toItemResponse(OrderItemEntity orderItemEntity) {
        return OrderItemResponse.builder()
                .orderItemId(orderItemEntity.getOrderItemId())
                .productId(orderItemEntity.getProduct().getId())
                .productName(orderItemEntity.getProduct().getName())
                .quantity(orderItemEntity.getQuantity())
                .priceProduct(orderItemEntity.getPrice())
                .priceTotal(orderItemEntity.getTotalPrice())
                .note(orderItemEntity.getNote())
                .threadId(orderItemEntity.getCreatedByThread())
                .build();
    }

    public PersonalOrderResponse toPersonalResponse(Long tableSessionId, Long threadId, List<OrderItemResponse> myItems) {
        PersonalOrderResponse response = PersonalOrderResponse.builder()
                .tableSessionId(tableSessionId)
                .threadId(threadId)
                .myItems(myItems)
                .build();
        response.recalculateMyTotal();
        return response;
    }

    public MasterTableOrderResponse toMasterResponse(OrderEntity orderEntity, List<OrderItemResponse> allItems) {
        Long total = allItems.stream()
                .map(item -> item.getPriceTotal() != null ? item.getPriceTotal() : 0L)
                .reduce(0L , Long::sum);

        return MasterTableOrderResponse.builder()
                .tableId(orderEntity.getTableSession().getTable().getTableId())
                .tableName(orderEntity.getTableSession().getTable().getTableName())
                .tableSessionId(orderEntity.getTableSession().getTableSessionId())
                .sessionStatus(orderEntity.getTableSession().getStatus().name())
                .totalPrice(total)
                .allTableItems(allItems)
                .build();
    }
}
