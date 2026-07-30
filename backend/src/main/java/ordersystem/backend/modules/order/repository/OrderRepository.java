package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

        List<OrderEntity> findByTableSessionTableSessionId(Long tableSessionId);

        List<OrderEntity> findByTableSessionTableTableIdAndStatusNot(Long tableId, OrderStatus status);

        Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);
}

