package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.enity.Order;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order , Long> {

    List<Order> findByTableSessionTableSessionId(String tableSessionId);
    List<Order> findByTableSessionTableIdAndStatusNot(Long tableId, OrderStatus status);

}
