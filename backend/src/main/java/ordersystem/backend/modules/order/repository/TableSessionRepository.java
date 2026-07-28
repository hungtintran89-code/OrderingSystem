package ordersystem.backend.modules.order.repository;

import ordersystem.backend.modules.order.enity.TableSession;
import ordersystem.backend.modules.order.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSession , Long> {

    Optional<TableSession> findByTableSessionId(String tableSessionId);
    Optional<TableSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

}
