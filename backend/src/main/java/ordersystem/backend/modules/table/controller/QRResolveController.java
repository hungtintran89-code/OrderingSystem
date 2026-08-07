package ordersystem.backend.modules.table.controller;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.catalog.dto.response.CategoryMenuResponse;
import ordersystem.backend.modules.table.dto.response.QRResolveResponse;
import ordersystem.backend.modules.table.service.impl.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/qr")
@RequiredArgsConstructor
public class QRResolveController {

    private final TableService tableService;

    @GetMapping("/resolve/{qr_token}")
    ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getQRResolve(@PathVariable String qr_token,
                                                                @RequestParam(required = false) Long threadId){
        List<CategoryMenuResponse> qrResolveResponse = tableService.resolveQrtoken(qr_token , threadId);
        return ResponseEntity.ok(ApiResponse.success("QR Resolve is success", qrResolveResponse));
    }
}
