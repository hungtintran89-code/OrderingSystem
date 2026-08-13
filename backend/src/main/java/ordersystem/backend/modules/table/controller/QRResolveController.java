package ordersystem.backend.modules.table.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.service.impl.TableService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("api/v1/qr")
@RequiredArgsConstructor
public class QRResolveController {

    private final TableService tableService;

    @GetMapping("/resolve/{qr_token}")
    public ResponseEntity<?> getQRResolve(
            @PathVariable String qr_token,
            @RequestParam(required = false) Long threadId,
            @RequestParam(required = false) String format,
            @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String acceptHeader
    ) {
        // Mặc định luôn Redirect 302 về giao diện Đặt món Frontend khi quét QR (trừ khi client chủ động truyền format=json)
        boolean isExplicitJsonCall = "json".equalsIgnoreCase(format)
                || (acceptHeader != null && acceptHeader.contains("application/json") && !acceptHeader.contains("text/html"));

        if (!isExplicitJsonCall) {
            HttpHeaders headers = new HttpHeaders();
            headers.setLocation(URI.create("http://localhost:3000/menu?tableToken=" + qr_token));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }

        List<CategoryMenuResponse> qrResolveResponse = tableService.resolveQrtoken(qr_token, threadId);
        return ResponseEntity.ok(ApiResponse.success("QR Resolve is success", qrResolveResponse));
    }

    @GetMapping("/info/{qr_token}")
    public ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getQRInfo(
            @PathVariable String qr_token,
            @RequestParam(required = false) Long threadId
    ) {
        List<CategoryMenuResponse> qrResolveResponse = tableService.resolveQrtoken(qr_token, threadId);
        return ResponseEntity.ok(ApiResponse.success("QR Info retrieved successfully", qrResolveResponse));
    }

    @GetMapping("/table-info/{qr_token}")
    public ResponseEntity<ApiResponse<QRResolveResponse>> getTableInfoByToken(@PathVariable String qr_token) {
        QRResolveResponse response = tableService.getTableInfoByQrToken(qr_token);
        return ResponseEntity.ok(ApiResponse.success("Table info retrieved successfully", response));
    }
}
