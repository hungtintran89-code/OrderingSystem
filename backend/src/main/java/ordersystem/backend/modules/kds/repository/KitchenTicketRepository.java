package ordersystem.backend.modules.kds.repository;

import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.enums.KitchenStation;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.RepositoryDefinition;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenTicketRepository extends JpaRepository<KitchenTicketEntity , Long> {

    // 📌 CÔNG DỤNG: Tìm vé KDS dựa theo ID dòng món ăn (Dùng để kiểm tra trạng thái món khi khách bấm hủy)
    Optional<KitchenTicketEntity> findByOrderItemId(Long orderItemId);

    // 📌 CÔNG DỤNG: Truy vấn lấy món để thực hiện gom/gộp món theo trạm
    List<KitchenTicketEntity> findByStationAndStatusIn(KitchenStation station, List<KitchenItemStatus> statuses);

    // 📌 CÔNG DỤNG: Lấy danh sách tất cả vé KDS của 1 Order
    List<KitchenTicketEntity> findByOrderId(Long orderId);

    // 📌 CÔNG DỤNG: Chỉ tải các món CHƯA NẤU HOẶC ĐANG NẤU. Món COMPLETED bị ẩn đi!
    @Query("SELECT k FROM KitchenTicketEntity k WHERE k.status IN :statuses ORDER BY k.receivedAt ASC")
    List<KitchenTicketEntity> findAllStatusOrStatus( KitchenItemStatus status1 , KitchenItemStatus status2);

    // Truy vấn lịch sử các món đã làm xong của 1 Đầu bếp
    List<KitchenTicketEntity> findByAssignedCookIdAndStatusOrderByCompletedAtDesc(Long cookId, KitchenItemStatus status);
}
