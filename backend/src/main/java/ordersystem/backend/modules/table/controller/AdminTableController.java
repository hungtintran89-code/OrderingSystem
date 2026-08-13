package ordersystem.backend.modules.table.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.request.CreateTableRequest;
import ordersystem.backend.modules.table.dto.response.FloorMapResponse;
import ordersystem.backend.modules.table.dto.response.QRCodeExportResponse;
import ordersystem.backend.modules.table.dto.response.TableResponse;
import ordersystem.backend.modules.table.enums.QRFormat;
import ordersystem.backend.modules.table.service.impl.QRCodeGeneratorService;
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
        QRFormat qrFormat = QRFormat.fromString(format);

        //2. Gọi service xử lí nghiệp vụ cho download
        QRCodeExportResponse qrCodeExportResponse = tableService.exportTableQrCode(tableId, qrFormat);

        // 3. Đóng gói dữ liệu byte[] vào trong ApiResponse
        ApiResponse<byte[]> apiResponse = ApiResponse.<byte[]>builder()
                .code(200)
                .message("Xuất mã QR thành công")
                .data(qrCodeExportResponse.getData()) // Nếu field =! data => Dùng .result(...)
                .build();

        // 4. Trả về HTTP Response dạng JSON
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + qrCodeExportResponse.getFileName() + "\"")
                .body(apiResponse);


    }
}
