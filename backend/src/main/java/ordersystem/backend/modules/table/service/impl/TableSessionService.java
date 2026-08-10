package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.entity.TableSessionEntity;
import java.util.List;

/**
 * Interface Service định nghĩa các thao tác quản lý Phiên hoạt động của bàn ăn (Table Session).
 */
public interface TableSessionService {
    TableSessionEntity getOrCreateActiveSession(Long tableId);
    void closeSession(String sessionId);
    void closeSessionEntity(TableSessionEntity tableSessionEntity);

    /**
     * Nghiệp vụ Chuyển bàn: Chuyển toàn bộ các đơn hàng active từ Bàn Nguồn sang Bàn Đích.
     * @param sourceTableId ID Bàn nguồn
     * @param targetTableId ID Bàn đích
     */
    void transferTable(Long sourceTableId, Long targetTableId);

    /**
     * Nghiệp vụ Gộp bàn: Gộp nhiều bàn nguồn thành 1 bàn đích duy nhất.
     * @param sourceTableIds Danh sách ID các bàn nguồn
     * @param targetTableId ID Bàn đích chính
     */
    void mergeTables(List<Long> sourceTableIds, Long targetTableId);
}
