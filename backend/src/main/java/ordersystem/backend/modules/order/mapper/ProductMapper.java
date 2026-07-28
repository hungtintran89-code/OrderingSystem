package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.ProductMenuResponse;
import ordersystem.backend.modules.order.enity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductMenuResponse toMenuResponse(Product product , Boolean is_ordered_by_thread ){
        return new ProductMenuResponse(
                product.getId(),
                product.getName() ,
                product.getPrice(),
                product.getImageUrl() ,
                is_ordered_by_thread ,
                product.getDescription() ,
                product.getIsAvailable()
                ) ;

    }

}
