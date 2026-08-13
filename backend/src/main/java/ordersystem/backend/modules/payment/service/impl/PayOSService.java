package ordersystem.backend.modules.payment.service.impl;

import com.fasterxml.jackson.databind.node.ObjectNode;
import ordersystem.backend.modules.payment.dto.request.CreatePaymentLinkRequest;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

public interface PayOSService {
    PaymentLinkResponse createVietQrPaymentLink(Long tableSessionId);
    PaymentLinkResponse createVietQrPaymentLink(CreatePaymentLinkRequest request);
    WebhookData verifyAndExtractWebhookData(Webhook webhookBody);
}
