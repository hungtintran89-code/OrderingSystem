package ordersystem.backend.modules.table.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.CreateZoneRequest;
import ordersystem.backend.modules.table.dto.request.UpdateZoneRequest;
import ordersystem.backend.modules.table.dto.response.ZoneResponse;
import ordersystem.backend.modules.table.service.impl.ZoneService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/zones")
@RequiredArgsConstructor
public class AdminZoneController {

    private final ZoneService zoneService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getAllZones() {
        List<ZoneResponse> response = zoneService.getAllZones();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khu vực thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ZoneResponse>> createZone(@Valid @RequestBody CreateZoneRequest request) {
        ZoneResponse response = zoneService.createZone(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khu vực mới thành công", response));
    }

    @PutMapping("/{zoneId}")
    public ResponseEntity<ApiResponse<ZoneResponse>> updateZone(
            @PathVariable Long zoneId,
            @Valid @RequestBody UpdateZoneRequest request) {
        ZoneResponse response = zoneService.updateZone(zoneId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu vực thành công", response));
    }

    @DeleteMapping("/{zoneId}")
    public ResponseEntity<ApiResponse<Void>> deleteZone(@PathVariable Long zoneId) {
        zoneService.deleteZone(zoneId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khu vực thành công", null));
    }
}
