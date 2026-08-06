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

        CategoryEntity categoryEntity = categoryRepository.findByCategoryName( request.getCategoryName())
                .orElseThrow( ()-> new CatalogException("The category not exsit")) ;

        ProductEntity productEntity = ProductEntity.builder()
                .productName( request.getProductName())
                .productPrice( request.getProductPrice())
                .productIsAvailable( request.getIsAvailbale())
                .productDescription( request.getDescription())
                .productImageUrl( request.getImageUrl())
                .category( categoryEntity )
                .build();

        if( productRepository.findByProductName( productEntity.getProductName()).isPresent()){
            throw new CatalogException("This product already exists!") ;
        }
        return productMapper.toProductResponse( productRepository.save( productEntity) ) ;
    }

    @Override
    @Cacheable(value = "single_product", key = "#productId", unless = "#result == null")
    public ProductResponse getProductById(Long productId) {
        ProductEntity productEntity = productRepository.findByProductId(productId)
                .orElseThrow(() -> new CatalogException("Dish with ID " + productId + " not found"));
        return productMapper.toProductResponse(productEntity);
    }
}

