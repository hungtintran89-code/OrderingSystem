package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface    TableRepository extends JpaRepository<RestaurantTable, Long> {

    //Tìm bàn theo mã băm QR.
    Optional<RestaurantTable> findByQrToken(String qrToken);

    //Kiểm tra trùng tên bàn khi tạo mới.
    boolean existsByTableName(String tableName);

    //Lấy danh sách tất cả các bàn đang hoạt động.
    List<RestaurantTable> findAllByIsActiveTrue();
}
