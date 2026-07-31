package ordersystem.backend.modules.table.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.enums.QRFormat;
import ordersystem.backend.modules.table.service.generator.QRCodeGeneratorService;
import ordersystem.backend.modules.table.service.impl.LiveFloorMapService;
import ordersystem.backend.modules.table.service.impl.TableService;
import ordersystem.backend.modules.table.service.impl.TableSessionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/tables")
public class AdminTableController {
    private final TableService tableService;
    private final LiveFloorMapService liveFloorMapService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request){
        TableResponse tableResponse = tableService.createTable(request);
        return ResponseEntity.ok(ApiResponse.success("Create Table is success", tableResponse));
    }

    @PreAuthorize("hasRole('MANAGER') or hasRole('STAFF')")
    @GetMapping("/floor-map"    )
    ResponseEntity<ApiResponse<List<FloorMapResponse>>> getFloorMap(){
        List<FloorMapResponse> listFloorMapResponse = liveFloorMapService.getLiveFloorMap();
        return ResponseEntity.ok(ApiResponse.success("Get Floor Map is succes", listFloorMapResponse));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/{tableId}/qr-code")
    public ResponseEntity<byte[]> downloadQRCode(
            @PathVariable Long tableId,
            @RequestParam(defaultValue = "pdf") String format
    ) {
        // 1. Chuyển tham số đầu vào thành QRFormat (PDF / PNG)
        QRFormat qrFormat = QRFormat.fromString(format);

        // 2. Gọi service xử lý nghiệp vụ xuất mã QR
        QRCodeExportResponse exportResponse = tableService.exportTableQrCode(tableId, qrFormat);

        // 3. 💡 SỬA: Trả về mảng byte[] trực tiếp kèm MediaType chuẩn (image/png hoặc application/pdf)
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(exportResponse.getContentType())) // Trả về image/png hoặc application/pdf
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + exportResponse.getFileName() + "\"")
                .body(exportResponse.getData()); // Trả trực tiếp byte[] không bọc JSON
    }
}
