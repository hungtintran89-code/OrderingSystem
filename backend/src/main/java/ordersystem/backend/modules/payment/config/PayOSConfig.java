package ordersystem.backend.modules.payment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class PayOSConfig {
    private final PaymentConfigRepository configRepository;
    private volatile PayOS cachedPayOS;

    @Value("${payos.client-id:}")
    private String envClientId;

    @Value("${payos.api-key:}")
    private String envApiKey;

    @Value("${payos.checksum-key:}")
    private String envChecksumKey;

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
        // Ưu tiên 1: Đọc từ Environment Variables (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)
        if (envClientId != null && !envClientId.isBlank() && !"PAYOS_CLIENT_ID".equalsIgnoreCase(envClientId)
                && envApiKey != null && !envApiKey.isBlank() && !"PAYOS_API_KEY".equalsIgnoreCase(envApiKey)) {
            log.info("Khởi tạo PayOS SDK từ Environment Variables.");
            return new PayOS(envClientId.trim(), envApiKey.trim(), envChecksumKey != null ? envChecksumKey.trim() : "");
        }

        // Ưu tiên 2: Đọc từ Database (bảng payment_configs)
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new PaymentException("Chưa cấu hình API Keys cho PayOS trong Hệ thống hoặc Environment Variable!"));
        return new PayOS(config.getClientId(), config.getApiKey(), config.getChecksumKey());
    }
}
