package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.order.enity.TableSession;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;

import java.util.List;

public interface TableSessionService {
    public TableSession getOrCreatActiveSession(Long tableId);
    public void closeSession(String sessionToken);
    public void cancelSession(String sessionToken);
}
