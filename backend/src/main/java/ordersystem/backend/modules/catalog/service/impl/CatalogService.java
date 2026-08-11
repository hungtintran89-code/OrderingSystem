package ordersystem.backend.modules.catalog.service.impl;

import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.CreateProductRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.request.UpdateProductRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;

import java.util.List;

import ordersystem.backend.modules.catalog.dto.request.UpdateCategoryRequest;

public interface CatalogService {

    // Admin tạo danh mục mới
    CategoryMenuResponse createCategory(CreateCategoryRequest createCategoryRequest);

    // Admin cập nhật danh mục
    CategoryMenuResponse updateCategory(Long categoryId, UpdateCategoryRequest updateCategoryRequest);

    // Admin xóa danh mục
    void deleteCategory(Long categoryId);

    // Admin lấy tất cả danh mục
    List<CategoryMenuResponse> getAllCategories();

    // Admin lấy tất cả món ăn
    List<ProductResponse> getAllProducts();

    // Admin bật/tắt công tắc tạm hết món
    ProductResponse toggleProductAvailability(Long productId, ToggleAvailabilityRequest toggleAvailabilityRequest);

    // Admin thêm món vào catalog
    ProductResponse addProductIntoCategory(CreateProductRequest createProductRequest);

    // Admin cập nhật món ăn
    ProductResponse updateProduct(Long productId, UpdateProductRequest updateProductRequest);

    // Admin xóa món ăn
    void deleteProduct(Long productId);

    ProductResponse getProductById(Long productId);
}
