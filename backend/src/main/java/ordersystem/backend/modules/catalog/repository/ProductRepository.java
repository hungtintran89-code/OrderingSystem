package ordersystem.backend.modules.catalog.repository;

import ordersystem.backend.modules.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryIdAndIsAvailableTrue(Long categoryId);
    List<Product> findByIsAvailableTrue();

    Optional<Product> findById(Long id); // Kiểu trả về mặc định là Optional<Product>

}
