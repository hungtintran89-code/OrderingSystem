package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    //Tìm bàn theo mã băm QR.
    Optional<RestaurantTable> findByQrToken(String qrToken);

    //Kiểm tra trùng tên bàn khi tạo mới.
    boolean existsByTableName(String tableName);

    //Lấy danh sách tất cả các bàn đang hoạt động.
    List<RestaurantTable> findAllByIsActiveTrue();


    Optional<RestaurantTable> findByTableName(String tableName);

    List<RestaurantTable> findByStatus(TableStatus status);
}
