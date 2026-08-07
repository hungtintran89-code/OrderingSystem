package ordersystem.backend.modules.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.payment.dto.request.CashConfirmRequest;
import ordersystem.backend.modules.payment.dto.request.PayOSConfigSaveRequest;
import ordersystem.backend.modules.payment.dto.response.CashConfirmResponse;
import ordersystem.backend.modules.payment.dto.response.PayOSConfigResponse;
import ordersystem.backend.modules.payment.service.impl.PaymentService;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {
    private final PaymentService paymentService;

    @PostMapping("/cash-confirm")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<CashConfirmResponse>> confirmCash(@Valid @RequestBody CashConfirmRequest request){
        CashConfirmResponse response = paymentService.confirmCashPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Cash payment confirmed successfully", response));
    }

    @PostMapping("/payos-config")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> saveConfig(@Valid @RequestBody PayOSConfigSaveRequest request){
        paymentService.savePayOSConfig(request);
        return ResponseEntity.ok(ApiResponse.success("Config PayOS saved successfully", null));
    }

    @GetMapping("/payos-config")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PayOSConfigResponse>> getPayOSConfig(){
        PayOSConfigResponse response = paymentService.getPayOSConfig();
        return ResponseEntity.ok(ApiResponse.success("PayOS config got successfully", response));
    }
}
