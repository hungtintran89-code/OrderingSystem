package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.event.TableStateChangeEvent;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TableSessionServiceImpl implements TableSessionService {

    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public TableSessionEntity getOrCreateActiveSession(Long tableId) {
        // Tìm session đang ACTIVE của bàn này
        return tableSessionRepository.findByTableTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseGet(() -> {
                    TableSessionEntity newSession = createNewSessionForTable(tableId);

                    //Thông báo Bàn vừa chuyển sang OCCUPIED
                    eventPublisher.publishEvent(new TableStateChangeEvent(
                            this,
                            newSession.getTable().getTableId(),
                            newSession.getTableName(),
                            TableStatus.OCCUPIED
                    ));

                    return newSession;
                });
    }

    // 1. Đóng Session theo token (gọi hàm cốt lõi bên dưới)
    @Override
    @Transactional
    public void closeSession(String sessionToken) {
        TableSessionEntity session = tableSessionRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionToken));
        closeSessionEntity(session); // Gọi hàm cốt lõi
    }
    // 2. ⭐ HÀM CỐT LÕI ĐÓNG SESSION DUY NHẤT TRONG TOÀN HỆ THỐNG
    @Override
    @Transactional
    public void closeSessionEntity(TableSessionEntity session) {
        // Cập nhật trạng thái
        session.setStatus(SessionStatus.CLOSED);
        session.setEndedAt(new Date());
        tableSessionRepository.save(session);
        // 🚀 BẮN EVENT: Giải phóng bàn về 🟢 EMPTY
        eventPublisher.publishEvent(new TableStateChangeEvent(
                this,
                session.getTable().getTableId(),
                session.getTableName(),
                TableStatus.EMPTY
        ));
    }

    @Transactional
    private TableSessionEntity createNewSessionForTable(Long tableId){
        RestaurantTableEntity tableInfo = restaurantTableRepository.findByTableId(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found with id: " + tableId));

        // Sinh mã sessionToken ngẫu nhiên duy nhất (Ví dụ: "sess_a1b2c3d4e5f6")
        String newSessionToken = "sess_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        //Tạo 1 session mới
        TableSessionEntity newSession = TableSessionEntity.builder()
                .table(tableInfo)
                .tableName(tableInfo.getTableName())
                .sessionToken(newSessionToken)
                .status(SessionStatus.ACTIVE)
                .startedAt(new Date())
                .build();

        //Lưu lại vào db session mới
        return tableSessionRepository.save(newSession);
    }
}
