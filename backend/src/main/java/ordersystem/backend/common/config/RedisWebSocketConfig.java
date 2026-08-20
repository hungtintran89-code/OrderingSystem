package ordersystem.backend.common.config;

import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.common.websocket.RedisWebSocketListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Slf4j
@Configuration
public class RedisWebSocketConfig {

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RedisWebSocketListener listener
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer() {
            @Override
            public void start() {
                try {
                    super.start();
                } catch (Exception e) {
                    log.warn("[RedisWSConfig] Không thể khởi chạy RedisMessageListenerContainer (Redis offline): {}. "
                            + "Ứng dụng tiếp tục hoạt động bằng Standalone WebSocket.", e.getMessage());
                }
            }
        };

        try {
            container.setConnectionFactory(connectionFactory);
            container.addMessageListener(listener, new ChannelTopic(RedisWebSocketListener.REDIS_CHANNEL));
        } catch (Exception e) {
            log.warn("[RedisWSConfig] Lỗi đăng ký listener với Redis container: {}", e.getMessage());
        }

        return container;
    }
}
