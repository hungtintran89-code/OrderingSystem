package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderItemEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    List<OrderItemEntity> findByOrderTableSessionTableSessionId(Long tableSessionId);

    List<OrderItemEntity> findByOrderTableSessionTableSessionIdAndCreatedByThread(Long tableSessionId, Long createdByThread);


    @Query("SELECT i FROM OrderItemEntity i WHERE i.order.status = :status")
    List<OrderItemEntity> findByOrderStatus(@Param("status") OrderStatus status);

    @Query("SELECT i.product.id AS productId, SUM(i.quantity) AS totalQuantity " +
            "FROM OrderItemEntity i " +
            "WHERE i.order.tableSession.tableSessionId = :tableSessionId " +
            "AND i.order.status != ordersystem.backend.modules.order.enums.OrderStatus.CANCELLED " +
            "GROUP BY i.product.id")
    List<Object[]> findOrderedItemSummaryBySession(@Param("tableSessionId") Long tableSessionId);
}

