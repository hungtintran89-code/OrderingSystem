package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.MasterTableOrderResponse;
import ordersystem.backend.modules.order.dto.response.OrderItemResponse;
import ordersystem.backend.modules.order.dto.response.PersonalOrderResponse;
import ordersystem.backend.modules.order.enity.Order;
import ordersystem.backend.modules.order.enity.OrderItem;
import ordersystem.backend.modules.order.enity.ProductOption;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
@Component
public class OrderMapper {

    // 1. Chuyển từ OrderItem Entity sang OrderItemResponse DTO
    public OrderItemResponse toItemResponse (OrderItem orderItem ){
        return new OrderItemResponse( orderItem.getOrder_item_id() ,
                                      orderItem.getProduct().getId() ,
                                      orderItem.getProduct().getName() ,
                                      orderItem.getQuantity() ,
                                      orderItem.getPrice() ,
                                      orderItem.getOrder_item_id() ,
                                      orderItem.getTotal_price() ,
                                      orderItem.getNote() ,
                                      orderItem.getCreatedByThread() ,
                                      orderItem.getSelectedOptions() ) ;

    }

    // 2. Chuyển sang PersonalOrderResponse (Cho KHÁCH xem ở máy cá nhân)
    public PersonalOrderResponse toPersonalResponse( Long table_session_id , Long thread_id ,  List<OrderItemResponse> myItems){
        return new PersonalOrderResponse(table_session_id, thread_id, myItems);
    }

    // 3. Chuyển sang MasterTableOrderResponse (Cho NHÂN VIÊN xem TAB CHUNG CẢ BÀN)
    public MasterTableOrderResponse toMasterResponse( Order order, List<OrderItemResponse> allItems ){
        Long total = allItems.stream()
                .map(OrderItemResponse::getPrice_total)
                .reduce(0L , Long::sum) ;
        return new MasterTableOrderResponse(
                order.getId() ,
                order.getTableSession().getTable().getTableName(),
                order.getTableSession().getTable().getTableId() ,
                order.getStatus().name() ,
                total ,
                order.getTableSession().getOpenedAt(),
                allItems
        ) ;
    }

}
