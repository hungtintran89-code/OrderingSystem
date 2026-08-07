package ordersystem.backend.modules.payment.service.impl;

import com.fasterxml.jackson.databind.node.ObjectNode;
import ordersystem.backend.modules.payment.dto.response.PaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

public interface PayOSService {
    PaymentLinkResponse  createVietQrPaymentLink(Long tableSessionId);
    WebhookData verifyAndExtractWebhookData(Webhook webhookBody);
}
