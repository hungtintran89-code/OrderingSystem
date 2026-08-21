package ordersystem.backend.modules.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import ordersystem.backend.modules.payment.dto.response.PaymentStatusResponse;
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

    @PostMapping({"/create-vietqr", "/create_vietqr"})
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createVietQr(@RequestBody CreatePaymentLinkRequest request){
        PaymentLinkResponse response = payOSService.createVietQrPaymentLink(request);
        return ResponseEntity.ok(ApiResponse.success("VietQr code generated successfully", response));
    }

    @PostMapping({"/payos_transfer_handler", "/payos-webhook", "/payos_webhook"})
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(@RequestBody Webhook webhookBody){
        try {
            paymentService.processPayOSWebhook(webhookBody);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(PaymentController.class).error("[PayOS Webhook Error] Exception in processPayOSWebhook: ", e);
        }
        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", null));
    }

    private Long parseSafeLong(String raw) {
        if (raw == null || raw.isBlank() || "undefined".equalsIgnoreCase(raw) || "null".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping({"/check-status/{payosOrderCode}", "/check-status"})
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> checkPaymentStatus(
            @PathVariable(required = false) String payosOrderCode,
            @RequestParam(required = false) String tableSessionId) {
        Long validOrderCode = parseSafeLong(payosOrderCode);
        Long validSessionId = parseSafeLong(tableSessionId);

        PaymentStatusResponse response = paymentService.checkAndSyncPaymentStatus(validOrderCode, validSessionId);
        return ResponseEntity.ok(ApiResponse.success("Checked payment status successfully", response));
    }

    @PostMapping({"/confirm-success/{tableSessionId}", "/confirm-success"})
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> confirmPaymentSuccess(
            @PathVariable(required = false) String tableSessionId,
            @RequestParam(required = false) String session,
            @RequestParam(required = false) String payosOrderCode) {
        Long validSessionId = parseSafeLong(tableSessionId != null ? tableSessionId : session);
        Long validOrderCode = parseSafeLong(payosOrderCode);

        PaymentStatusResponse response = paymentService.confirmPaymentSuccess(validSessionId, validOrderCode);
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed successfully", response));
    }

    @GetMapping("/cancel")
    public ResponseEntity<ApiResponse<Void>> handleCancelCallback(
            @RequestParam("orderCode") Long orderCode,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Payment cancelled by user", null));
    }

    @GetMapping("/success")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> handleSuccessCallback(
            @RequestParam("orderCode") Long orderCode,
            @RequestParam(value = "status", required = false) String status) {
        PaymentStatusResponse response = paymentService.checkAndSyncPaymentStatus(orderCode, null);
        return ResponseEntity.ok(ApiResponse.success("Payment succeeded", response));
    }
}
