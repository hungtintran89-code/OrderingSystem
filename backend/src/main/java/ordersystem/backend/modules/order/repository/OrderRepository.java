package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

        List<OrderEntity> findByTableSessionTableTableIdAndStatusNot(Long tableId, OrderStatus status);

        // Tìm danh sách Order thuộc về một TableSession
        List<OrderEntity> findByTableSessionTableSessionId(Long tableSessionId);

        // Lọc danh sách Order theo trạng thái kèm phân trang (Cho lịch sử đơn)
        Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);

}

