package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSession, Long> {

    Optional<TableSession> findByTableSessionId(Long tableSessionId);
    Optional<TableSession> findByTableTableIdAndStatus(Long tableId, SessionStatus status);
}
