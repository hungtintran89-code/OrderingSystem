package ordersystem.backend.modules.catalog.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.CreateProductRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.catalog.exception.CatalogException;
import ordersystem.backend.modules.catalog.repository.CategoryRepository;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
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

        CategoryEntity categoryEntity = categoryRepository.findByCategoryName(request.getCategoryName())
                                .orElseThrow( ()-> new CatalogException("The category not exsit")) ;

        ProductEntity productEntity = ProductEntity.builder()
                .productName( request.getProductName())
                .productPrice( request.getProductPrice())
                .productIsAvailable( request.getIsAvailbale())
                .productDescription( request.getDescription())
                .productImageUrl( request.getImageUrl())
                .categoryEntity( categoryEntity )
                .build();
        ProductResponse product = catalogService.addProductIntoCategory( productEntity , categoryEntity.getCategoryId() ) ;
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", product));
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
}
