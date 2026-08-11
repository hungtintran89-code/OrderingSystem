package ordersystem.backend.modules.catalog.service.run;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.catalog.dto.request.CreateCategoryRequest;
import ordersystem.backend.modules.catalog.dto.request.CreateProductRequest;
import ordersystem.backend.modules.catalog.dto.request.ToggleAvailabilityRequest;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.catalog.dto.response.ProductResponse;
import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import ordersystem.backend.modules.catalog.entity.ProductEntity;
import ordersystem.backend.modules.catalog.exception.CatalogException;
import ordersystem.backend.modules.catalog.mapper.CatalogMapper;
import ordersystem.backend.modules.catalog.mapper.ProductMapper;
import ordersystem.backend.modules.catalog.repository.CategoryRepository;
import ordersystem.backend.modules.catalog.repository.ProductRepository;
import ordersystem.backend.modules.catalog.service.impl.CatalogService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


import ordersystem.backend.modules.catalog.dto.request.UpdateCategoryRequest;

@Service
@RequiredArgsConstructor

public class CatalogServiceImpl implements CatalogService {
    final private CategoryRepository categoryRepository ;
    final private ProductRepository productRepository ;
    final private CatalogMapper catalogMapper ;
    final private ProductMapper productMapper ;

    // 2. Admin tạo Danh mục mới
    @Override
    @Transactional
    @CacheEvict( value = "categories" , allEntries = true)
    public CategoryMenuResponse createCategory(CreateCategoryRequest createCategoryRequest ){

        if( categoryRepository.findByCategoryName(createCategoryRequest.getCategoryName()).isPresent()){
            throw new CatalogException("This category already exists!") ;
        }

        CategoryEntity categoryEntity = CategoryEntity.builder()
                .categoryName(createCategoryRequest.getCategoryName())
                .build();
        CategoryEntity categorySaved = categoryRepository.save(categoryEntity) ;
        return catalogMapper.toCategoryMenuResponse(categorySaved) ;
    }

    // Admin cập nhật tên danh mục
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryMenuResponse updateCategory(Long categoryId, UpdateCategoryRequest request) {
        CategoryEntity categoryEntity = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CatalogException("Danh mục với ID " + categoryId + " không tồn tại"));

        String newName = request.getCategoryName() != null ? request.getCategoryName().trim() : "";
        if (newName.isBlank()) {
            throw new CatalogException("Tên danh mục không được để trống!");
        }

        categoryRepository.findByCategoryNameIgnoreCase(newName).ifPresent(existing -> {
            if (!existing.getCategoryId().equals(categoryId)) {
                throw new CatalogException("Danh mục '" + newName + "' đã tồn tại!");
            }
        });

        categoryEntity.setCategoryName(newName);
        CategoryEntity updated = categoryRepository.save(categoryEntity);
        return catalogMapper.toCategoryMenuResponse(updated);
    }

    // Admin xóa danh mục
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long categoryId) {
        CategoryEntity categoryEntity = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CatalogException("Danh mục với ID " + categoryId + " không tồn tại"));

        if (categoryEntity.getProductEntities() != null && !categoryEntity.getProductEntities().isEmpty()) {
            throw new CatalogException("Không thể xóa danh mục '" + categoryEntity.getCategoryName() + "' vì đang chứa " + categoryEntity.getProductEntities().size() + " món ăn. Vui lòng di chuyển hoặc xóa các món ăn trước!");
        }

        categoryRepository.delete(categoryEntity);
    }

    // Admin lấy tất cả danh mục
    @Cacheable(value = "categories", key = "'all_categories'")
    @Override
    public List<CategoryMenuResponse> getAllCategories (){

        List<CategoryEntity> categoryEntities = categoryRepository.findAllWithProducts() ;

        return categoryEntities.stream()
                .map( catalogMapper::toCategoryMenuResponse)
                .collect(Collectors.toList());
    }

    // Admin bật/tắt công tắc tạm hết món
    @Override
    @Transactional
    @CacheEvict(value = {"categories", "single_product"}, allEntries = true)
    public ProductResponse toggleProductAvailability (Long productId , ToggleAvailabilityRequest toggleAvailabilityRequest){

        ProductEntity productEntity = productRepository.findByProductId(productId)
                .orElseThrow( ()-> new CatalogException("Dish with ID "+ productId +" not found")) ;

        productEntity.setProductIsAvailable(toggleAvailabilityRequest.getIsAvailable());
        return productMapper.toProductResponse(productEntity) ;
    }

    // Admin thêm món vào catalog
    @Override
    @Transactional
    @CacheEvict( value = "categories" , allEntries = true)
    public ProductResponse addProductIntoCategory (CreateProductRequest request ){

        String cleanCatName = request.getCategoryName() != null ? request.getCategoryName().trim() : "";
        CategoryEntity categoryEntity = categoryRepository.findByCategoryNameIgnoreCase(cleanCatName)
                .orElseGet(() -> categoryRepository.findByCategoryName(cleanCatName)
                        .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().categoryName(cleanCatName).build())));

        String cleanProductName = request.getProductName() != null ? request.getProductName().trim() : "Món ăn";
        if (productRepository.findByProductName(cleanProductName).isPresent()) {
            throw new CatalogException("Món ăn '" + cleanProductName + "' đã có trong thực đơn. Vui lòng nhập tên khác!");
        }

        Boolean isAvail = request.getIsAvailbale();
        if (isAvail == null) {
            isAvail = true;
        }

        ProductEntity productEntity = ProductEntity.builder()
                .productName(cleanProductName)
                .productPrice(request.getProductPrice())
                .productIsAvailable(isAvail)
                .productDescription(request.getDescription())
                .productImageUrl(request.getImageUrl())
                .category(categoryEntity)
                .build();

        return productMapper.toProductResponse(productRepository.save(productEntity));
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        List<ProductEntity> products = productRepository.findAll();
        return products.stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"categories", "single_product"}, allEntries = true)
    public ProductResponse updateProduct(Long productId, ordersystem.backend.modules.catalog.dto.request.UpdateProductRequest request) {
        ProductEntity productEntity = productRepository.findByProductId(productId)
                .orElseThrow(() -> new CatalogException("Dish with ID " + productId + " not found"));

        if (request.getProductName() != null && !request.getProductName().isBlank()) {
            productEntity.setProductName(request.getProductName().trim());
        }
        if (request.getProductPrice() != null) {
            productEntity.setProductPrice(request.getProductPrice());
        }
        if (request.getImageUrl() != null) {
            productEntity.setProductImageUrl(request.getImageUrl());
        }
        if (request.getDescription() != null) {
            productEntity.setProductDescription(request.getDescription());
        }
        if (request.getIsAvailable() != null) {
            productEntity.setProductIsAvailable(request.getIsAvailable());
        }
        if (request.getCategoryName() != null && !request.getCategoryName().isBlank()) {
            CategoryEntity categoryEntity = categoryRepository.findByCategoryName(request.getCategoryName().trim())
                    .orElseGet(() -> categoryRepository.save(CategoryEntity.builder().categoryName(request.getCategoryName().trim()).build()));
            productEntity.setCategory(categoryEntity);
        }

        ProductEntity saved = productRepository.save(productEntity);
        return productMapper.toProductResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"categories", "single_product"}, allEntries = true)
    public void deleteProduct(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new CatalogException("Dish with ID " + productId + " not found");
        }
        productRepository.deleteById(productId);
    }

    @Override
    @Cacheable(value = "single_product", key = "#productId", unless = "#result == null")
    public ProductResponse getProductById(Long productId) {
        ProductEntity productEntity = productRepository.findByProductId(productId)
                .orElseThrow(() -> new CatalogException("Dish with ID " + productId + " not found"));
        return productMapper.toProductResponse(productEntity);
    }
}

