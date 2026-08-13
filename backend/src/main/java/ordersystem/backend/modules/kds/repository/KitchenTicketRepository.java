package ordersystem.backend.modules.kds.repository;

import jakarta.persistence.LockModeType;
import ordersystem.backend.modules.kds.entity.KitchenTicketEntity;
import ordersystem.backend.modules.kds.enums.KitchenItemStatus;
import ordersystem.backend.modules.kds.enums.KitchenStation;
import ordersystem.backend.modules.order.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.RepositoryDefinition;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenTicketRepository extends JpaRepository<KitchenTicketEntity , Long> {


    // 📌 API MÀN HÌNH CHUNG: Lấy các món PENDING (Chờ làm) và COOKING (Đang làm)
    List<KitchenTicketEntity> findByStatus( KitchenItemStatus status );
    List<KitchenTicketEntity> findByStatusInOrderByKitchenTicketIdAsc(List<KitchenItemStatus> statuses);
    Optional<KitchenTicketEntity> findByOrderItemId(Long orderItemId);

    // 📌 API MÀN HÌNH CÁ NHÂN: Chỉ lấy các món ĐANG NẤU do CHÍNH ĐẦU BẾP ĐÓ nhận làm
    List<KitchenTicketEntity> findByStatusAndAssignedCookId(KitchenItemStatus status, Long cookId);


    // Truy vấn lịch sử các món đã làm xong của 1 Đầu bếp (Món nào xong mới nhất lên đầu)
    List<KitchenTicketEntity> findByAssignedCookIdAndStatusOrderByKitchenTicketIdDesc(Long cookId, KitchenItemStatus status);

    // Truy vấn Lịch sử Hoàn thành Chung của TẤT CẢ đầu bếp (Món nào xong mới nhất lên đầu)
    List<KitchenTicketEntity> findByStatusOrderByKitchenTicketIdDesc(KitchenItemStatus status, Pageable pageable);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT k FROM KitchenTicketEntity k WHERE k.kitchenTicketId = :id")
    Optional<KitchenTicketEntity> findByIdWithLock(@Param("id") Long id);


}
