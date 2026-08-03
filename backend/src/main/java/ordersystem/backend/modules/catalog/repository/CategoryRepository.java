package ordersystem.backend.modules.catalog.repository;

import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    Optional<CategoryEntity> findByCategoryId (Long CategoryId );
    Optional<CategoryEntity> findByCategoryName ( String CategoryName ) ;

    @Query("SELECT DISTINCT c FROM CategoryEntity c LEFT JOIN FETCH c.productEntities p WHERE p.productIsAvailable = true OR p IS NULL")
    List<CategoryEntity> findAllWithProducts();


}

