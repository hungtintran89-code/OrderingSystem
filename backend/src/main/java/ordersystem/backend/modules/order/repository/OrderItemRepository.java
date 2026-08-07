package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    // ⚡ Lấy danh sách món của CẢ BÀN (Kèm thông tin Product)
    @EntityGraph(attributePaths = {"product"})
    List<OrderItemEntity> findByOrderTableSessionTableSessionId(Long tableSessionId);

    // ⚡ Lấy danh sách món của ĐIỆN THOẠI CÁ NHÂN (Kèm thông tin Product)
    @EntityGraph(attributePaths = {"product"})
    List<OrderItemEntity> findByOrderTableSessionTableSessionIdAndCreatedByThread(Long tableSessionId, Long createdByThread);

}

