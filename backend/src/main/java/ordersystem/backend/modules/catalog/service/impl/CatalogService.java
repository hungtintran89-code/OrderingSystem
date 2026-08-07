package ordersystem.backend.modules.catalog.service.impl;

import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.CreateProductRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;

import java.util.List;

public interface CatalogService {

    // Admin tạo danh mục mới
    CategoryMenuResponse createCategory(CreateCategoryRequest createCategoryRequest);

    // Admin lấy tất cả danh mục
    List<CategoryMenuResponse> getAllCategories();

    // Admin bật/tắt công tắc tạm hết món
    ProductResponse toggleProductAvailability(Long productId, ToggleAvailabilityRequest toggleAvailabilityRequest);

    // Admin thêm món vào catalog
    ProductResponse addProductIntoCategory(CreateProductRequest createProductRequest);

    ProductResponse getProductById(Long productId);
}
