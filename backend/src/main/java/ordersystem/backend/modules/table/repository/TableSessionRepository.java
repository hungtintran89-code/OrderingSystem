package ordersystem.backend.modules.table.repository;

import ordersystem.backend.modules.table.entity.RestaurantTable;
import ordersystem.backend.modules.table.entity.TableSession;
import ordersystem.backend.modules.table.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface TableSessionRepository extends JpaRepository<TableSession, Long> {

    //Tìm Session đang ACTIVE của một bàn.
    Optional<TableSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    //Tìm Session theo mã sessionToken
    Optional<TableSession> findBySessionToken(String sessionToken);

    //Tìm các Session rác quá hạn để dọn dẹp
    List<TableSession> findAllByStatusAndStartedAtBefore(SessionStatus status, Date startedAt);
}
