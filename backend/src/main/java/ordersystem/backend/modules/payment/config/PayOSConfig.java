package ordersystem.backend.modules.payment.config;

import lombok.RequiredArgsConstructor;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Configuration
@RequiredArgsConstructor
public class PayOSConfig {
    private final PaymentConfigRepository configRepository;

    public PayOS getPayOSInstance() {
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("PayOS API Keys have not been configured in the system.!"));
        return new PayOS(config.getClientId(), config.getApiKey(), config.getChecksumKey());
    }
}
