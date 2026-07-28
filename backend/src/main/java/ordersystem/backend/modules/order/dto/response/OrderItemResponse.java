package ordersystem.backend.modules.order.dto.response;

import lombok.*;
import ordersystem.backend.modules.order.enity.ProductOption;

import java.util.ArrayList;
import java.util.List;


@Getter @Setter
@NoArgsConstructor
@Builder
    public class OrderItemResponse {

    private Long orderItem_id ;
    private Long product_id ;
    private String product_name ;
    private Long quantity ;
    private Long price_product ;
    private Long price_item ;
    private Long price_total ;
    private String note ;
    private String thread_id ;
    private List<ProductOption> selectedOptionNames = new ArrayList<>() ;

    public OrderItemResponse(Long orderItem_id, Long product_id, String product_name, Long quantity, Long price_product, Long price_item, Long price_total, String note, String thread_id, List<ProductOption> selectedOptionNames) {
        this.orderItem_id = orderItem_id;
        this.product_id = product_id;
        this.product_name = product_name;
        this.quantity = quantity;
        this.price_product = price_product;
        this.price_item = price_item;
        this.price_total = price_total;
        this.note = note;
        this.thread_id = thread_id;
        this.selectedOptionNames = selectedOptionNames;
    }
}
