package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.entity.Order;
import ordersystem.backend.modules.order.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class OrderMapper {

    public OrderItemResponse toItemResponse(OrderItem orderItem) {
        return OrderItemResponse.builder()
                .orderItemId(orderItem.getOrderItemId())
                .productId(orderItem.getProduct().getId())
                .productName(orderItem.getProduct().getName())
                .quantity(orderItem.getQuantity())
                .priceProduct(orderItem.getPrice())
                .priceTotal(orderItem.getTotalPrice())
                .note(orderItem.getNote())
                .threadId(orderItem.getCreatedByThread())
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

    public MasterTableOrderResponse toMasterResponse(Order order, List<OrderItemResponse> allItems) {
        Long total = allItems.stream()
                .map(item -> item.getPriceTotal() != null ? item.getPriceTotal() : 0L)
                .reduce(0L , Long::sum);

        return MasterTableOrderResponse.builder()
                .tableId(order.getTableSession().getTable().getTableId())
                .tableName(order.getTableSession().getTable().getTableName())
                .tableSessionId(order.getTableSession().getTableSessionId())
                .sessionStatus(order.getTableSession().getStatus().name())
                .totalPrice(total)
                .allTableItems(allItems)
                .build();
    }
}
