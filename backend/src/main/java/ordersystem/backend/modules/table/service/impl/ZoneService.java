package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.dto.request.CreateZoneRequest;
import ordersystem.backend.modules.table.dto.request.UpdateZoneRequest;
import ordersystem.backend.modules.table.dto.response.ZoneResponse;

import java.util.List;

public interface ZoneService {
    List<ZoneResponse> getAllZones();
    ZoneResponse createZone(CreateZoneRequest request);
    ZoneResponse updateZone(Long zoneId, UpdateZoneRequest request);
    void deleteZone(Long zoneId);
}
