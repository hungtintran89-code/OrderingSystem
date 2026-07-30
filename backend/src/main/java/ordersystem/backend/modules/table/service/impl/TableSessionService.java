package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.entity.TableSessionEntity;

public interface TableSessionService {
    public TableSessionEntity getOrCreatActiveSession(Long tableId);
    public void closeSession(String sessionToken);
    public void cancelSession(String sessionToken);
}
