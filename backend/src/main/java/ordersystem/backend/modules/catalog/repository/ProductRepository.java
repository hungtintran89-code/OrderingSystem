package ordersystem.backend.modules.catalog.repository;

import ordersystem.backend.modules.catalog.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<ProductEntity> findAll () ;
    Optional<ProductEntity> findByProductId (Long productId ) ;
    Optional<ProductEntity> findByProductName (String productName ) ;


}

