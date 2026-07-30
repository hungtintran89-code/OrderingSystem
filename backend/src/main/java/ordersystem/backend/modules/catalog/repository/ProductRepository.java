package ordersystem.backend.modules.catalog.repository;

import ordersystem.backend.modules.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryIdAndIsAvailableTrue(Long categoryId);

    List<Product> findByIsAvailableTrue();
}

