package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTableEntity, Long> {

    //Tìm bàn theo Id
    Optional<RestaurantTableEntity> findById(Long tableId);

    //Tìm bàn theo mã băm QR.
    Optional<RestaurantTableEntity> findByQrToken(String qrToken);

    //Kiểm tra trùng tên bàn khi tạo mới.
    boolean existsByTableName(String tableName);

    //Lấy danh sách tất cả các bàn đang có trong hệ thống nhà hàng
    List<RestaurantTableEntity> findAllByIsActiveTrue();


    Optional<RestaurantTableEntity> findByTableName(String tableName);

    List<RestaurantTableEntity> findByTableStatus(TableStatus status);

}
