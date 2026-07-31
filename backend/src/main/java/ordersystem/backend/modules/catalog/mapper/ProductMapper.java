package ordersystem.backend.modules.catalog.mapper;

import ordersystem.backend.modules.catalog.dto.response.ProductMenuResponse;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductMenuResponse toMenuResponse(ProductEntity product, Boolean isOrderedByThread) {
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
