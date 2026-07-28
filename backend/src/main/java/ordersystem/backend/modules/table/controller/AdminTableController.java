package ordersystem.backend.modules.table.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.enums.QrFormat;
import ordersystem.backend.modules.table.service.impl.QRCodeGeneratorService;
import ordersystem.backend.modules.table.service.impl.TableService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/tables")
public class AdminTableController {
    private final TableService tableService;
    private final TableSessionService tableSessionService;
    private final QRCodeGeneratorService qrCodeGeneratorService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request){
        TableResponse tableResponse = tableService.createTable(request);
        return ResponseEntity.ok(ApiResponse.success("Create Table is success", tableResponse));
    }

    @PreAuthorize("hasRole('MANEGER') or hasRole('STAFF')")
    @GetMapping("/floor-map")
    ResponseEntity<ApiResponse<List<FloorMapResponse>>> getFloorMap(){
        List<FloorMapResponse> listFloorMapResponse = tableService.getLiveFloorMap();
        return ResponseEntity.ok(ApiResponse.success("Get Floor Map is succes", listFloorMapResponse));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/{tableId}/qr-code")
    public ResponseEntity<ApiResponse<byte[]>> downloadQRCode(
            @PathVariable Long tableId,
            @RequestParam(defaultValue = "pdf") String format
    ){
        //1. Chuyển tham số đầu vào thành QRFormat
        QrFormat qrFormat = QrFormat.fromString()
    }
}
