package ordersystem.backend.modules.catalog.mapper;

import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import ordersystem.backend.modules.catalog.entity.ProductEntity;

import java.util.List;
import java.util.stream.Collectors;

public class CatalogMapper {

    public ProductResponse toProductResponse(ProductEntity productEntity){
        return ProductResponse.builder()
                .productId(productEntity.getProductId())
                .categoryName(productEntity.getCategoryEntity() != null ? productEntity.getCategoryEntity().getCategoryName(): null )
                .categoryId(productEntity.getCategoryEntity() != null ? productEntity.getCategoryEntity().getCategoryId() : null)
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
