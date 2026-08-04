package ordersystem.backend.modules.payment.service.impl;

import com.fasterxml.jackson.databind.node.ObjectNode;
import ordersystem.backend.modules.payment.dto.request.CashConfirmRequest;
import ordersystem.backend.modules.payment.dto.request.PayOSConfigSaveRequest;
import ordersystem.backend.modules.payment.dto.response.CashConfirmResponse;
import ordersystem.backend.modules.payment.dto.response.PayOSConfigResponse;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.type.Webhook;

public interface PaymentService {
    CashConfirmResponse confirmCashPayment(CashConfirmRequest request);
    void processPayOSWebhook(Webhook webhookBody);
    PaymentConfigEntity savePayOSConfig(PayOSConfigSaveRequest request);
    PayOSConfigResponse getPayOSConfig();
}
