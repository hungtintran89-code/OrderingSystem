package ordersystem.backend.modules.table.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.service.impl.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/qr")
@RequiredArgsConstructor
public class QRResolveController {

    private final TableService tableService;

    @GetMapping("/resolve/{qr_token}")
    ResponseEntity<ApiResponse<QRResolveResponse>> getQRResolve(@PathVariable String qr_token){
        QRResolveResponse qrResolveResponse = tableService.resolveQrtoken(qr_token);
        return ResponseEntity.ok(ApiResponse.success("QR Resolve is success", qrResolveResponse));
    }
}
