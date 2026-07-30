package ordersystem.backend.modules.table.service.impl;

import ordersystem.backend.modules.table.dto.response.FloorMapResponse;

import java.util.List;

public interface LiveFloorMapService {
    public List<FloorMapResponse> getLiveFloorMap();
}
