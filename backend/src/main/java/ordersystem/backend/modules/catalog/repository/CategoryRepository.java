package ordersystem.backend.modules.catalog.repository;

import ordersystem.backend.modules.catalog.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    Optional<CategoryEntity> findByCategoryId (Long CategoryId );
    Optional<CategoryEntity> findByCategoryName ( String CategoryName ) ;
    List<CategoryEntity> findAll () ;


}

