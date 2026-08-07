package ordersystem.backend.modules.catalog.mapper;

import ordersystem.backend.modules.catalog.dto.response.ProductMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductMenuResponse toMenuResponse(ProductEntity productEntity, Boolean isOrderedByThread) {
        return ProductMenuResponse.builder()
                .productId(productEntity.getProductId())
                .productName(productEntity.getProductName())
                .price(productEntity.getProductPrice())
                .imageUrl(productEntity.getProductImageUrl())
                .isOrdered(isOrderedByThread)
                .description(productEntity.getProductDescription())
                .isAvailable(productEntity.getProductIsAvailable())
                .build();
    }

    public ProductResponse toProductResponse ( ProductEntity productEntity ){
        return ProductResponse.builder()
                .productId( productEntity.getProductId())
                .productName( productEntity.getProductName() )
                .productPrice( productEntity.getProductPrice() )
                .productImageUrl( productEntity.getProductImageUrl() )
                .description( productEntity.getProductDescription())
                .isAvailable( productEntity.getProductIsAvailable())
                .build();
    }
}
