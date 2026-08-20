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

    public boolean publish(String destination, Object payload) {
        try {
            String payloadJson;
            if (payload instanceof byte[]) {
                // Chuyển mảng byte JSON thành chuỗi JSON UTF-8 thuần túy
                payloadJson = new String((byte[]) payload, java.nio.charset.StandardCharsets.UTF_8);
            } else if (payload instanceof String) {
                payloadJson = (String) payload;
            } else {
                payloadJson = objectMapper.writeValueAsString(payload);
            }

            RedisWebSocketMessage message = new RedisWebSocketMessage(destination, payloadJson);
            String messageJson = objectMapper.writeValueAsString(message);

            log.debug("[RedisWSPublisher] Publishing broadcast to destination: {}", destination);
            redisTemplate.convertAndSend(RedisWebSocketListener.REDIS_CHANNEL, messageJson);
            return true;
        } catch (Exception e) {
            log.warn("[RedisWSPublisher] Redis server offline, fallback sang Local WebSocket Dispatch: {}", e.getMessage());
            return false;
        }
    }
}
