package ordersystem.backend.modules.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ordersystem.backend.modules.order.enity.OrderItem;

import java.util.ArrayList;
import java.util.List;


@Setter @Getter
public class PersonalOrderResponse {

    private Long table_session_id ;
    private Long thread_id ;
    private Long my_total ;
    private List<OrderItemResponse> my_items = new ArrayList<>() ;

    public PersonalOrderResponse(Long tableSessionId, Long threadId, List<OrderItemResponse> myItems) {
        this.table_session_id = tableSessionId;
        this.thread_id = threadId;
        this.my_items = myItems;
        recalculateMyTotal();
    }


    public void recalculateMyTotal(){
        if( my_items != null && !my_items.isEmpty()) {
            this.my_total = my_items.stream()
                    .map(OrderItemResponse :: getPrice_item )
                    .reduce(0L, Long::sum);
            return ;
        }
        this.my_total = 0L ;
    }

}
