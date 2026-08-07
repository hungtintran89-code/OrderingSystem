package ordersystem.backend.modules.payment.repository;

import ordersystem.backend.modules.payment.entity.PaymentTransactionEntity;
import ordersystem.backend.modules.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    //Tìm hóa đơn thông qua order code
    Optional<PaymentTransactionEntity> findByPayosOrderCode(Long orderCode);

    //Truy vấn trạng thái giao dịch của 1 tableSessionId
    Optional<PaymentTransactionEntity> findByTableSessionTableSessionIdAndPaymentStatus(Long tableSessionId, PaymentStatus status);
}
