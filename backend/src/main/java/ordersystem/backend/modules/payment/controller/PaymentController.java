package ordersystem.backend.modules.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ordersystem.backend.common.payload.ApiResponse;
import ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import ordersystem.backend.modules.payment.service.impl.PayOSService;
import ordersystem.backend.modules.payment.service.impl.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.payos.type.Webhook;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PayOSService payOSService;
    private final PaymentService paymentService;

    @PostMapping("/create_vietqr")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> createVietQr(@Valid @RequestBody CreatePaymentLinkRequest request){
        PaymentLinkResponse response = payOSService.createVietQrPaymentLink(request.getTableSessionId());
        return ResponseEntity.ok(ApiResponse.success("VietQr code generated successfully", response));
    }

    @PostMapping("/payos_transfer_handler")
    public ResponseEntity<ApiResponse<Void>> handlePayOSWebhook(@RequestBody Webhook webhookBody){
        paymentService.processPayOSWebhook(webhookBody);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", null));
    }
}
