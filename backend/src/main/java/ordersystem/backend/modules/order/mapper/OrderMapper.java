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
                .productId(orderItemEntity.getProduct().getProductId())
                .productName(orderItemEntity.getProduct().getProductName())
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
        Long total = (allItems != null && !allItems.isEmpty())
                ? allItems.stream()
                        .mapToLong(item -> item.getPriceTotal() != null ? item.getPriceTotal() : 0L)
                        .sum()
                : (orderEntity.getTotalAmount() != null ? orderEntity.getTotalAmount() : 0L);

        String tableName = "Bàn 01";
        String zone = "Tầng 1";
        Long tableId = 1L;
        Long tableSessionId = null;
        String sessionStatus = "ACTIVE";

        if (orderEntity.getTableSession() != null) {
            tableSessionId = orderEntity.getTableSession().getTableSessionId();
            if (orderEntity.getTableSession().getStatus() != null) {
                sessionStatus = orderEntity.getTableSession().getStatus().name();
            }
            if (orderEntity.getTableSession().getTable() != null) {
                tableId = orderEntity.getTableSession().getTable().getTableId();
                tableName = orderEntity.getTableSession().getTable().getTableName();
                zone = orderEntity.getTableSession().getTable().getZone();
            } else if (orderEntity.getTableSession().getTableName() != null) {
                tableName = orderEntity.getTableSession().getTableName();
            }
        }

        String orderType = (orderEntity.getOrderType() != null && !orderEntity.getOrderType().trim().isEmpty())
                ? orderEntity.getOrderType()
                : ("TAKEAWAY".equalsIgnoreCase(tableName) ? "TAKEAWAY" : "DINE_IN");

        if ("TAKEAWAY".equalsIgnoreCase(orderType)) {
            tableName = "Mang Về";
            zone = "Mang Về";
        }

        String paymentMethod = orderEntity.getPaymentMethod();
        String paymentStatus = orderEntity.getPaymentStatus();

        boolean isPaidOrCompleted = orderEntity.getStatus() == ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED
                || "PAID".equalsIgnoreCase(orderEntity.getPaymentStatus())
                || (orderEntity.getTableSession() != null && orderEntity.getTableSession().getStatus() == ordersystem.backend.modules.table.enums.SessionStatus.CLOSED);

        if (paymentStatus == null || paymentStatus.trim().isEmpty() || ("UNPAID".equalsIgnoreCase(paymentStatus) && isPaidOrCompleted)) {
            paymentStatus = isPaidOrCompleted ? "PAID" : "UNPAID";
        }

        if (paymentMethod == null || paymentMethod.trim().isEmpty() || ("UNPAID".equalsIgnoreCase(paymentMethod) && isPaidOrCompleted)) {
            paymentMethod = isPaidOrCompleted ? "VIETQR" : "UNPAID";
        }

        return MasterTableOrderResponse.builder()
                .orderId(orderEntity.getId())
                .orderCode(orderEntity.getOrderCode())
                .tableId(tableId)
                .tableName(tableName)
                .zone(zone)
                .tableSessionId(tableSessionId)
                .sessionStatus(sessionStatus)
                .totalPrice(total)
                .openedAt(orderEntity.getCreatedAt())
                .createdAt(orderEntity.getCreatedAt())
                .status(orderEntity.getStatus() != null ? orderEntity.getStatus().name() : "PENDING")
                .orderType(orderType)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
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
