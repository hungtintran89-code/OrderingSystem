package ordersystem.backend.modules.table.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionCleanupScheduler {

    private final TableSessionRepository tableSessionRepository;
    private final TableSessionService tableSessionService; // 👈 Inject TableSessionService thay vì EventPublisher

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void autoCleanExpiredSessions() {
        long fourHoursAgo = System.currentTimeMillis() - (4 * 60 * 60 * 1000);
        Date thresholdDate = new Date(fourHoursAgo);

        List<TableSessionEntity> expiredSessions = tableSessionRepository
                .findAllByStatusAndStartedAtBefore(SessionStatus.ACTIVE, thresholdDate);

        if (expiredSessions.isEmpty()) {
            return;
        }

        // Tái sử dụng 100% logic Đóng Session & Bắn Event từ TableSessionService!
        for (TableSessionEntity session : expiredSessions) {
            log.warn("🧹 [Scheduler] Tự động dọn dẹp Session quá hạn ID: {} của Bàn: {}",
                    session.getTableSessionId(), session.getTableName());

            tableSessionService.closeSessionEntity(session);
        }
    }
}