package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderItem;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderTableSessionTableSessionId(Long tableSessionId);

    List<OrderItem> findByOrderTableSessionTableSessionIdAndCreatedByThread(Long tableSessionId, Long createdByThread);

    @Query("SELECT i FROM OrderItem i WHERE i.order.status = :status")
    List<OrderItem> findByOrderStatus(@Param("status") OrderStatus status);

    @Query("SELECT i.product.id AS productId, SUM(i.quantity) AS totalQuantity " +
            "FROM OrderItem i " +
            "WHERE i.order.tableSession.tableSessionId = :tableSessionId " +
            "AND i.order.status != 'CANCELLED' " +
            "GROUP BY i.product.id")
    List<OrderItem> findOrderedItemSummaryBySession(@Param("tableSessionId") Long tableSessionId);
}
