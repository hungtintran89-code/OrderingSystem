package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.dto.response.TableInvoiceResponse;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import org.springframework.stereotype.Component;

import java.util.Date;
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

    public TableInvoiceResponse toTableInvoiceResponse(
            Long invoiceCode ,
            TableSessionEntity tableSession ,
            List<OrderItemResponse> orderItemResponseList ,
            Long vat ,
            Long discount){
        // 1. Tính tổng tiền các món
        Long priceTotal = orderItemResponseList.stream()
                .mapToLong(item -> item.getPriceTotal() != null ? item.getPriceTotal() : 0L )
                .sum() ;

        // 2. Tính thuế VAT (VD: vatRate = 0.08 cho 8% VAT)
        long vatAmount = Math.round( priceTotal * vat);
        long finalAmount = priceTotal + vatAmount;

        return TableInvoiceResponse.builder()
                .invoiceCode(invoiceCode)
                .tableId(tableSession.getTable().getTableId())
                .tableName(tableSession.getTable().getTableName())
                .tableSessionId(tableSession.getTableSessionId())
                .orderItemEntityList(orderItemResponseList)
                .totalPrice(priceTotal)
                .vat(vatAmount)
                .discount(discount)
                .finalTotalPrice(finalAmount)
                .createAt( new Date())
                .build();
    }

}
