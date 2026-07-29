package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.order.entity.TableSession;

public interface TableSessionService {
    public TableSession getOrCreatActiveSession(Long tableId);
    public void closeSession(String sessionToken);
    public void cancelSession(String sessionToken);
}
