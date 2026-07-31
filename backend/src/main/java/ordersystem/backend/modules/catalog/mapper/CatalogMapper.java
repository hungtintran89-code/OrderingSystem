package ordersystem.backend.modules.catalog.mapper;

import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CatalogMapper {

    public ProductResponse toProductResponse(ProductEntity productEntity){
        return ProductResponse.builder()
                .productId(productEntity.getProductId())
                .categoryName(productEntity.getCategory() != null ? productEntity.getCategory().getCategoryName(): null )
                .categoryId(productEntity.getCategory() != null ? productEntity.getCategory().getCategoryId() : null)
                .productName(productEntity.getProductName())
                .productPrice(productEntity.getProductPrice())
                .description(productEntity.getProductDescription())
                .isAvailable(productEntity.getProductIsAvailable())
                .productImageUrl(productEntity.getProductImageUrl())
                .build();
    }

    public CategoryMenuResponse toCategoryMenuResponse (CategoryEntity categoryEntity){
        List<ProductResponse> productResponseList = categoryEntity.getProductEntities().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        return CategoryMenuResponse.builder()
                .categoryId(categoryEntity.getCategoryId())
                .categoryName(categoryEntity.getCategoryName())
                .products(productResponseList)
                .build();
    }


}
