package ordersystem.backend.modules.payment.repository;

import jakarta.persistence.LockModeType;
import ordersystem.backend.modules.payment.entity.PaymentTransactionEntity;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    // Tìm hóa đơn thông qua order code
    Optional<PaymentTransactionEntity> findByPayosOrderCode(Long orderCode);

    // Lock pessimistic write để tránh race condition khi PayOS webhook gửi duplicate hoặc đồng thời
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransactionEntity p WHERE p.payosOrderCode = :orderCode")
    Optional<PaymentTransactionEntity> findWithLockByPayosOrderCode(@Param("orderCode") Long orderCode);

    // Truy vấn trạng thái giao dịch của 1 tableSessionId
    Optional<PaymentTransactionEntity> findByTableSessionTableSessionIdAndPaymentStatus(Long tableSessionId, PaymentStatus status);

    // Danh sách giao dịch theo session
    List<PaymentTransactionEntity> findByTableSessionTableSessionId(Long tableSessionId);

    // Tìm TẤT CẢ transactions theo session và trạng thái (VD: hủy hết PENDING cũ khi tạo QR mới)
    List<PaymentTransactionEntity> findAllByTableSessionTableSessionIdAndPaymentStatus(Long tableSessionId, PaymentStatus status);
}
