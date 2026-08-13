package ordersystem.backend.modules.payment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.payment.entity.PaymentConfigEntity;
import ordersystem.backend.modules.payment.exception.PaymentException;
import ordersystem.backend.modules.payment.repository.PaymentConfigRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

import java.util.Set;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class PayOSConfig {
    private final PaymentConfigRepository configRepository;
    private volatile PayOS cachedPayOS;

    /**
     * Danh sách các giá trị placeholder KHÔNG HỢP LỆ - sẽ bị reject nếu gặp.
     * Bao gồm các giá trị mặc định trong migration V11/V13 và application.properties
     */
    private static final Set<String> PLACEHOLDER_VALUES = Set.of(
            "PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY",
            "payos_client_id", "payos_api_key", "payos_checksum_key",
            "YOUR_CLIENT_ID", "YOUR_API_KEY", "YOUR_CHECKSUM_KEY",
            "", " "
    );

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
        log.info("[PayOS] Evicting PayOS cached instance - sẽ khởi tạo lại khi có request tiếp theo.");
        this.cachedPayOS = null;
    }

    private PayOS initPayOS() {
        // Ưu tiên 1: Đọc từ Environment Variables (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)
        if (isValidKey(envClientId) && isValidKey(envApiKey)) {
            String maskedClientId = maskKey(envClientId);
            String maskedApiKey = maskKey(envApiKey);
            log.info("[PayOS] Khởi tạo PayOS SDK từ Environment Variables. ClientID={}, ApiKey={}", maskedClientId, maskedApiKey);
            return new PayOS(envClientId.trim(), envApiKey.trim(), envChecksumKey != null ? envChecksumKey.trim() : "");
        }

        // Ưu tiên 2: Đọc từ Database (bảng payment_configs)
        PaymentConfigEntity config = configRepository.findFirstByIsActiveTrue()
                .orElseThrow(() -> new PaymentException(
                        "Chưa cấu hình API Keys cho PayOS! Vui lòng vào Admin > Quản lý Bàn & Mã QR để cài đặt PayOS API Key."));

        // Validate DB config không chứa placeholder
        if (!isValidKey(config.getClientId()) || !isValidKey(config.getApiKey())) {
            log.error("[PayOS] API Keys trong bảng payment_configs là PLACEHOLDER, không hợp lệ! ClientID='{}', ApiKey='{}'",
                    config.getClientId(), maskKey(config.getApiKey()));
            throw new PaymentException(
                    "API Keys PayOS trong hệ thống chưa được cấu hình đúng (đang là placeholder). "
                    + "Vui lòng vào Admin > Quản lý Bàn & Mã QR để nhập API Key thật từ https://my.payos.vn");
        }

        String maskedClientId = maskKey(config.getClientId());
        String maskedApiKey = maskKey(config.getApiKey());
        log.info("[PayOS] Khởi tạo PayOS SDK từ Database (payment_configs). ClientID={}, ApiKey={}", maskedClientId, maskedApiKey);
        return new PayOS(config.getClientId(), config.getApiKey(),
                config.getChecksumKey() != null ? config.getChecksumKey() : "");
    }

    /**
     * Kiểm tra API key có hợp lệ hay không (không phải null, rỗng, hoặc placeholder)
     */
    private boolean isValidKey(String key) {
        if (key == null || key.isBlank()) return false;
        return !PLACEHOLDER_VALUES.contains(key.trim());
    }

    /**
     * Mask API key cho log bảo mật (chỉ hiện 4 ký tự đầu + 2 ký tự cuối)
     */
    private String maskKey(String key) {
        if (key == null || key.length() <= 6) return "***";
        return key.substring(0, 4) + "****" + key.substring(key.length() - 2);
    }
}
