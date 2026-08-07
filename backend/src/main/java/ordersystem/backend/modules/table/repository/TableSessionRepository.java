package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSessionEntity, Long> {

    // ⚡ Tìm Session ACTIVE của bàn (Có JOIN Bàn)
    @EntityGraph(attributePaths = {"table"})
    Optional<TableSessionEntity> findByTableTableIdAndStatus(Long tableId, SessionStatus status);

    // ⚡ Tìm Session theo Token (Có JOIN Bàn)
    @EntityGraph(attributePaths = {"table"})
    Optional<TableSessionEntity> findBySessionToken(String sessionToken);

    // ⚡ Tìm Session theo ID (Có JOIN Bàn)
    @EntityGraph(attributePaths = {"table"})
    Optional<TableSessionEntity> findByTableSessionId(Long tableSessionId);

    // ⚡ Tìm tất cả các session đang ACTIVE (Có JOIN Bàn cho Sơ đồ bàn Sống)
    @EntityGraph(attributePaths = {"table"})
    List<TableSessionEntity> findAllByStatus(SessionStatus status);

    // ⚡ Tìm các Session rác quá hạn (Có JOIN Bàn cho Tiến trình dọn dẹp)
    @EntityGraph(attributePaths = {"table"})
    List<TableSessionEntity> findAllByStatusAndStartedAtBefore(SessionStatus status, Date startedAt);

}
