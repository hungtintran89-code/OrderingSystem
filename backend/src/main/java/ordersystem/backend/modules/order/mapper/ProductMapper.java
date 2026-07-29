package ordersystem.backend.modules.order.mapper;

import ordersystem.backend.modules.order.dto.response.ProductMenuResponse;
import ordersystem.backend.modules.catalog.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductMenuResponse toMenuResponse(Product product, Boolean isOrderedByThread) {
        return ProductMenuResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .isOrdered(isOrderedByThread)
                .description(product.getDescription())
                .isAvailable(product.getIsAvailable())
                .build();
    }
}
