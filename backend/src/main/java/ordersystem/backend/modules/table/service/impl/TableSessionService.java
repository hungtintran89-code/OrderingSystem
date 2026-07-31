package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.entity.TableSessionEntity;

public interface TableSessionService {
    public TableSessionEntity getOrCreateActiveSession(Long tableId);
    public void closeSession(String sessionId);
    public void closeSessionEntity(TableSessionEntity tableSessionEntity);
}
