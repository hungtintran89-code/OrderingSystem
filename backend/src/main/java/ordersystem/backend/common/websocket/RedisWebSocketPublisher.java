package ordersystem.backend.common.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisWebSocketPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(String destination, Object payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            RedisWebSocketMessage message = new RedisWebSocketMessage(destination, payloadJson);
            String messageJson = objectMapper.writeValueAsString(message);
            
            log.debug("[RedisWSPublisher] Publishing broadcast to destination: {}", destination);
            redisTemplate.convertAndSend(RedisWebSocketListener.REDIS_CHANNEL, messageJson);
        } catch (Exception e) {
            log.error("[RedisWSPublisher] Failed to publish message to Redis: ", e);
        }
    }
}
