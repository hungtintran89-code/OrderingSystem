package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSessionEntity, Long> {

    Optional<TableSessionEntity> findByTableSessionId(Long tableSessionId);
    Optional<TableSessionEntity> findByTableTableIdAndStatus(Long tableId, SessionStatus status);
}
