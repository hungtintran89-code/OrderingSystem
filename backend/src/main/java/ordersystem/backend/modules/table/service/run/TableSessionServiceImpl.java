package ordersystem.backend.modules.table.service.run;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.exception.ResourceNotFoundException;
import ordersystem.backend.modules.order.entity.OrderEntity;
import ordersystem.backend.modules.order.repository.OrderRepository;
import ordersystem.backend.modules.table.entity.RestaurantTableEntity;
import ordersystem.backend.modules.table.entity.TableSessionEntity;
import ordersystem.backend.modules.table.enums.SessionStatus;
import ordersystem.backend.modules.table.enums.TableStatus;
import ordersystem.backend.modules.table.event.TableStateChangeEvent;
import ordersystem.backend.modules.table.repository.RestaurantTableRepository;
import ordersystem.backend.modules.table.repository.TableSessionRepository;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Service triển khai logic quản lý Phiên hoạt động của Bàn ăn (Table Sessions),
 * bao gồm Mở/Đóng phiên, Chuyển bàn, Gộp bàn và cập nhật trạng thái vật lý.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TableSessionServiceImpl implements TableSessionService {

    private final TableSessionRepository tableSessionRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    @Transactional
    public TableSessionEntity getOrCreateActiveSession(Long tableId) {
        // Tìm session đang ACTIVE của bàn này
        return tableSessionRepository.findByTableTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .orElseGet(() -> {
                    TableSessionEntity newSession = createNewSessionForTable(tableId);

                    // 📌 Cập nhật trạng thái bàn vật lý trong DB thành OCCUPIED
                    RestaurantTableEntity table = newSession.getTable();
                    table.setTableStatus(TableStatus.OCCUPIED);
                    restaurantTableRepository.save(table); // Lưu lại DB

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
    @CacheEvict(value = "floor_map", allEntries = true)
    public void closeSessionEntity(TableSessionEntity session) {
        // 📌 1. Cập nhật tất cả đơn hàng chưa bị HỦY của session này thành COMPLETED & PAID
        List<OrderEntity> sessionOrders = orderRepository.findAllByTableSessionTableSessionIdAndStatusNot(
                session.getTableSessionId(), ordersystem.backend.modules.order.enums.OrderStatus.CANCELLED);
        if (sessionOrders != null && !sessionOrders.isEmpty()) {
            for (OrderEntity order : sessionOrders) {
                order.setStatus(ordersystem.backend.modules.order.enums.OrderStatus.COMPLETED);
                order.setPaymentStatus("PAID");
                if (order.getPaymentMethod() == null || "UNPAID".equalsIgnoreCase(order.getPaymentMethod())) {
                    order.setPaymentMethod("CASH");
                }
            }
            orderRepository.saveAll(sessionOrders);
        }

        // 📌 2. Cập nhật trạng thái session thành CLOSED
        session.setStatus(SessionStatus.CLOSED);
        session.setEndedAt(new Date());
        tableSessionRepository.save(session);

        // 📌 3. Cập nhật trạng thái bàn vật lý trong DB về EMPTY
        RestaurantTableEntity table = session.getTable();
        if (table != null) {
            table.setTableStatus(TableStatus.EMPTY);
            restaurantTableRepository.save(table);
        }

        // 🚀 BẮN EVENT: Giải phóng bàn về 🟢 EMPTY
        if (session.getTable() != null) {
            eventPublisher.publishEvent(new TableStateChangeEvent(
                    this,
                    session.getTable().getTableId(),
                    session.getTableName(),
                    TableStatus.EMPTY
            ));
        }

        // Xóa Cache trạng thái bàn khỏi Redis ngay lập tức
        String sessionKey = "table_session_key:" + session.getTableSessionId();
        redisTemplate.delete(sessionKey);
    }

    @Transactional
    public TableSessionEntity createNewSessionForTable(Long tableId){
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

    /**
     * Nghiệp vụ Chuyển bàn: Chuyển toàn bộ các đơn hàng active từ Bàn Nguồn sang Bàn Đích.
     * Đóng session ở Bàn nguồn và giải phóng bàn nguồn về EMPTY.
     * 
     * @param sourceTableId ID Bàn nguồn
     * @param targetTableId ID Bàn đích
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "floor_map", allEntries = true)
    public void transferTable(Long sourceTableId, Long targetTableId) {
        if (sourceTableId.equals(targetTableId)) {
            throw new IllegalArgumentException("Bàn nguồn và Bàn đích không được trùng nhau.");
        }

        // 1. Lấy phiên ACTIVE của bàn nguồn
        TableSessionEntity sourceSession = tableSessionRepository.findByTableTableIdAndStatus(sourceTableId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Bàn nguồn hiện không có phiên hoạt động nào."));

        // 2. Lấy hoặc tạo mới phiên ACTIVE ở bàn đích
        TableSessionEntity targetSession = getOrCreateActiveSession(targetTableId);

        // 3. Tìm các đơn hàng thuộc session nguồn và chuyển sang session đích
        List<OrderEntity> sourceOrders = orderRepository.findAll().stream()
                .filter(o -> o.getTableSession().getTableSessionId().equals(sourceSession.getTableSessionId()))
                .toList();

        for (OrderEntity order : sourceOrders) {
            order.setTableSession(targetSession);
            orderRepository.save(order);
        }

        // 4. Đóng session ở bàn nguồn
        closeSessionEntity(sourceSession);
        log.info("📢 Chuyển bàn thành công từ TableID {} sang TableID {}", sourceTableId, targetTableId);
    }

    /**
     * Nghiệp vụ Gộp bàn: Gộp toàn bộ các đơn hàng từ danh sách Bàn Nguồn vào 1 Bàn Đích chính.
     * 
     * @param sourceTableIds Danh sách ID các bàn nguồn
     * @param targetTableId ID Bàn đích chính
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "floor_map", allEntries = true)
    public void mergeTables(List<Long> sourceTableIds, Long targetTableId) {
        TableSessionEntity targetSession = getOrCreateActiveSession(targetTableId);

        for (Long sourceId : sourceTableIds) {
            if (sourceId.equals(targetTableId)) continue;

            tableSessionRepository.findByTableTableIdAndStatus(sourceId, SessionStatus.ACTIVE)
                    .ifPresent(sourceSession -> {
                        List<OrderEntity> orders = orderRepository.findAll().stream()
                                .filter(o -> o.getTableSession().getTableSessionId().equals(sourceSession.getTableSessionId()))
                                .toList();
                        for (OrderEntity order : orders) {
                            order.setTableSession(targetSession);
                            orderRepository.save(order);
                        }
                        closeSessionEntity(sourceSession);
                    });
        }
        log.info("📢 Gộp bàn thành công {} bàn nguồn vào TableID {}", sourceTableIds.size(), targetTableId);
    }
}
