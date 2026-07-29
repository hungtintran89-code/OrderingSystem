package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.entity.Order;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByTableSessionTableSessionId(Long tableSessionId);
    List<Order> findByTableSessionTableTableIdAndStatusNot(Long tableId, OrderStatus status);
}
