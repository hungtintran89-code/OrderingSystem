package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.order.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface RestaurantTableRepository extends JpaRepository<RestaurantTable,Long> {

    Optional<RestaurantTable> findByQrToken(String qrToken);

    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    List<RestaurantTable> findByStatus(TableStatus status);
}
