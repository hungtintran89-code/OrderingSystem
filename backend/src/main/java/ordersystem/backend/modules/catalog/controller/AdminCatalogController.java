package ordersystem.backend.modules.catalog.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.UpdateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.CreateProductRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.repository.CategoryRepository;
import ordersystem.backend.modules.catalog.service.impl.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

    final private CatalogService catalogService ;
    final private CategoryRepository categoryRepository ;

    // 1. Admin tạo Danh mục mới (VD: Khai vị, Món chính, Đồ uống)
    // URL: POST /api/v1/admin/categories
    @PostMapping("/categories")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<CategoryMenuResponse>> createCategory (@Valid @RequestBody CreateCategoryRequest createCategoryRequest){
        CategoryMenuResponse categoryMenuResponse = catalogService.createCategory(createCategoryRequest) ;
        return ResponseEntity.ok( ApiResponse.success( "Category created successfully" , categoryMenuResponse)) ;
    }

    // 1.1. Admin cập nhật tên Danh mục
    // URL: PUT /api/v1/admin/categories/{id}
    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<CategoryMenuResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        CategoryMenuResponse categoryMenuResponse = catalogService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", categoryMenuResponse));
    }

    // 1.2. Admin xóa Danh mục
    // URL: DELETE /api/v1/admin/categories/{id}
    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        catalogService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }

    // 2. Admin lấy danh sách Danh mục
    // URL: GET /api/v1/admin/categories
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF' , 'KITCHEN' )")
    public ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getAllCategories() {
        List<CategoryMenuResponse> categories = catalogService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully", categories));
    }


    // 3. Admin tạo Món ăn mới vào Thực đơn
    // URL: POST /api/v1/admin/products
    @PostMapping("/products")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse product = catalogService.addProductIntoCategory( request ) ;
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", product));
    }

    // 3.1. Admin lấy tất cả Món ăn
    // URL: GET /api/v1/admin/products
    @GetMapping("/products")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'KITCHEN')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = catalogService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", products));
    }

    // 3.2. Admin cập nhật thông tin Món ăn
    // URL: PUT /api/v1/admin/products/{id}
    @PutMapping("/products/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ordersystem.backend.modules.catalog.dto.request.UpdateProductRequest request) {
        ProductResponse product = catalogService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    // 3.3. Admin xóa Món ăn khỏi Thực đơn
    // URL: DELETE /api/v1/admin/products/{id}
    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        catalogService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }

    // 4. Admin / Nhân viên Bật/Tắt công tắc "Tạm hết món"
    // URL: PATCH /api/v1/admin/products/5/toggle-availability
    @PatchMapping("/products/{id}/toggle-availability")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<ProductResponse>> toggleAvailability(
            @PathVariable Long id,
            @Valid @RequestBody ToggleAvailabilityRequest request) {
        ProductResponse product = catalogService.toggleProductAvailability(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product availability updated successfully", product));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getClientMenu (){
        List<CategoryMenuResponse> categoryMenuResponseList = catalogService.getAllCategories() ;
        return ResponseEntity.ok( ApiResponse.success("Menu retrieved successfully" , categoryMenuResponseList)) ;
    }
}
