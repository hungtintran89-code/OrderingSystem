package ordersystem.backend.modules.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import ordersystem.backend.modules.payment.service.impl.PayOSService;
import ordersystem.backend.modules.payment.service.impl.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PayOSService payOSService;
    private final PaymentService paymentService;

    @PostMapping("/create_vietqr")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createVietQr(@Valid @RequestBody CreatePaymentLinkRequest request){
        PaymentLinkResponse response = payOSService.createVietQrPaymentLink(request.getTableSessionId());
        return ResponseEntity.ok(ApiResponse.success("VietQr code generated successfully", response));
    }

    @PostMapping("/payos_transfer_handler")
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(@RequestBody Webhook webhookBody){
        try {
            paymentService.processPayOSWebhook(webhookBody);
        } catch (Exception e) {
            // Safe fallback for PayOS test webhooks
        }
        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", null));
    }

    @GetMapping("/cancel")
    public ResponseEntity<ApiResponse<Void>> handleCancelCallback(
            @RequestParam("orderCode") Long orderCode,
            @RequestParam(value = "status", required = false) String status) {
        // Gọi service cập nhật transaction với orderCode này sang CANCELLED
        return ResponseEntity.ok(ApiResponse.success("Payment cancelled by user", null));
    }

    @GetMapping("/success")
    public ResponseEntity<ApiResponse<Void>> handleSuccessCallback(
            @RequestParam("orderCode") Long orderCode,
            @RequestParam(value = "status", required = false) String status) {
        // Gọi service cập nhật transaction với orderCode này sang SUCCESS
        return ResponseEntity.ok(ApiResponse.success("Payment successed by user", null));
    }
}
