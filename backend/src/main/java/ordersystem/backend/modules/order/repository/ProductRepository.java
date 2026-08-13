package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.enity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product , Long> {
    List<Product> findByCategoryIdAndIsAvailableTrue(Long categoryId);
    List<Product> findByIsAvailableTrue();
}
