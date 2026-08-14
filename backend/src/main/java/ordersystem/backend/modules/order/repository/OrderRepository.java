package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

        //-------- HÀM CƠ BẢN (KHÔNG JOIN) - Dành cho các tác vụ kiểm tra vắn tắt------------------
        List<OrderEntity> findByTableSessionTableSessionIdInAndStatus ( List<Long> activeSessionIds , OrderStatus status ) ;
        List<OrderEntity> findByTableSessionTableSessionIdInAndStatusNot ( List<Long> activeSessionIds , OrderStatus status ) ;
        List<OrderEntity> findByTableSessionTableSessionIdIn ( List<Long> activeSessionIds ) ;

        // Tìm danh sách Order thuộc về một TableSession
        Optional<OrderEntity> findByTableSessionTableSessionIdAndStatus(Long tableSessionId, OrderStatus status);
        List<OrderEntity> findAllByTableSessionTableSessionIdAndStatus(Long tableSessionId, OrderStatus status);
        List<OrderEntity> findAllByTableSessionTableSessionIdAndStatusNot(Long tableSessionId, OrderStatus status);
        List<OrderEntity> findAllByTableSessionTableSessionId(Long tableSessionId);

        // Lọc danh sách Order theo trạng thái kèm phân trang (Cho lịch sử đơn)
        Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);

        //--------- HÀM CÓ @EntityGraph (JOIN ĐẦY ĐỦ ITEMS + PRODUCT + TABLE SESSION) - Dành cho Lịch sử đơn-------------

        @EntityGraph(attributePaths = {"tableSession"})
        Page<OrderEntity> findWithDetailsByStatus(OrderStatus status, Pageable pageable);

        @EntityGraph(attributePaths = {"tableSession"})
        @Query("SELECT o FROM OrderEntity o ORDER BY o.createdAt DESC")
        Page<OrderEntity> findAllWithDetails(Pageable pageable);

        @EntityGraph(attributePaths = {"tableSession"})
        @Query("SELECT o FROM OrderEntity o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt DESC")
        Page<OrderEntity> findWithDetailsByCreatedAtBetween(@org.springframework.data.repository.query.Param("startDate") java.util.Date startDate, @org.springframework.data.repository.query.Param("endDate") java.util.Date endDate, Pageable pageable);

        @EntityGraph(attributePaths = {"tableSession"})
        @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt DESC")
        Page<OrderEntity> findWithDetailsByStatusAndCreatedAtBetween(@org.springframework.data.repository.query.Param("status") OrderStatus status, @org.springframework.data.repository.query.Param("startDate") java.util.Date startDate, @org.springframework.data.repository.query.Param("endDate") java.util.Date endDate, Pageable pageable);
}

