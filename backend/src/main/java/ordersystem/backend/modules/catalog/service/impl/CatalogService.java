package ordersystem.backend.modules.catalog.service.impl;

import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface CatalogService {

    // Khách lấy toàn bộ Thực đơn
    List<CategoryMenuResponse> getFullMenuForCustomer () ;

    // Admin tạo danh mục mới
    CategoryMenuResponse createCategory(CreateCategoryRequest createCategoryRequest ) ;

    // Admin lấy tất cả danh mục
    List<CategoryMenuResponse> getAllCategories ();

    // Admin bật/tắt công tắc tạm hết món
    ProductResponse toggleProductAvailability (Long productId , ToggleAvailabilityRequest toggleAvailabilityRequest) ;

    // Admin thêm món vào catalog
    ProductResponse addProductIntoCategory (ProductEntity product , Long categoryId  );
}
