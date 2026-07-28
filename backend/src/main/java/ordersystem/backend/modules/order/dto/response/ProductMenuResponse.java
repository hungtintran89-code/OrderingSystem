package ordersystem.backend.modules.order.dto.response;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter @Getter
@NoArgsConstructor @AllArgsConstructor
public class ProductMenuResponse {

    private Long product_id ;
    private String product_name ;
    private Long price ;
    private String img_url ;
    private Boolean is_ordered = false ;
    private String description ;
    private Boolean is_available ;

}
