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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogServiceImpl implements CatalogService {

    final private CategoryRepository categoryRepository ;
    final private ProductRepository productRepository ;
    final private CatalogMapper catalogMapper ;
    final private ProductMapper productMapper ;

    // 1. Lấy Thực đơn đầy đủ cho Khách (Trả về cây Danh mục -> Danh sách món)
    @Override
    public List<CategoryMenuResponse> getFullMenuForCustomer () {

        List<CategoryEntity> categoryMenuResponseList = categoryRepository.findAll() ;

        return categoryMenuResponseList.stream()
                .map( catalogMapper :: toCategoryMenuResponse )
                .collect(Collectors.toList()) ;
    }

    // 2. Admin tạo Danh mục mới
    @Override
    @Transactional
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
    public ProductResponse toggleProductAvailability (Long productId , ToggleAvailabilityRequest toggleAvailabilityRequest){

        ProductEntity productEntity = productRepository.findByProductId(productId)
                .orElseThrow( ()-> new CatalogException("Dish with ID "+ productId +" not found")) ;

        productEntity.setProductIsAvailable(toggleAvailabilityRequest.getIsAvailable());
        return productMapper.toProductResponse(productEntity) ;
    }

    // Admin thêm món vào catalog
    @Override
    @Transactional
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
}
