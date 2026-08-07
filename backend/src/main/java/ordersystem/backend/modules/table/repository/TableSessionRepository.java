package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSessionEntity, Long> {

    //Tìm Session đang ACTIVE của một bàn.
    Optional<TableSessionEntity> findByTableTableIdAndStatus(Long tableId, SessionStatus status);

    //Tìm Session theo mã sessionToken
    Optional<TableSessionEntity> findBySessionToken(String sessionToken);

    //Tìm tất cả các session có trạng thái active
    List<TableSessionEntity> findAllByStatus(SessionStatus status);

    //Tìm các Session rác quá hạn để dọn dẹp
    List<TableSessionEntity> findAllByStatusAndStartedAtBefore(SessionStatus status, Date startedAt);

    //Tìm Tablesession bằng sessionId
    Optional<TableSessionEntity> findByTableSessionId(Long tableSessionId);
}
