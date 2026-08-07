package ordersystem.backend.modules.payment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class PayOSConfig {
    private final PaymentConfigRepository configRepository;
    private volatile PayOS cachedPayOS;

    public PayOS getPayOSInstance() {
        if (cachedPayOS == null) {
            synchronized (this) {
                if (cachedPayOS == null) {
                    cachedPayOS = initPayOS();
                }
            }
        }
        return cachedPayOS;
    }

    public synchronized void evictCache() {
        log.info("Evicting PayOS cached instance");
        this.cachedPayOS = null;
    }

    private PayOS initPayOS() {
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new PaymentException("PayOS API Keys have not been configured in the system.!"));
        return new PayOS(config.getClientId(), config.getApiKey(), config.getChecksumKey());
    }
}
