package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.entity.TableSession;

public interface TableSessionService {
    public TableSession getOrCreatActiveSession(Long tableId);
    public void closeSession(String sessionToken);
    public void cancelSession(String sessionToken);
}
