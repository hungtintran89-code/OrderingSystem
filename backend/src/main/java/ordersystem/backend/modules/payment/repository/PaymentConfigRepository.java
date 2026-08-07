package ordersystem.backend.modules.payment.repository;

import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface PaymentConfigRepository extends JpaRepository<PaymentConfigEntity, Long> {
    Optional<PaymentConfigEntity> findFirstByIsActiveTrue();
}
