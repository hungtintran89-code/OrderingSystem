package ordersystem.backend.common.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisWebSocketListener implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public static final String REDIS_CHANNEL = "ws-clustered-channel";

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            byte[] body = message.getBody();
            // Deserialize message string from Redis channel
            String jsonStr = (String) redisTemplate.getValueSerializer().deserialize(body);
            
            RedisWebSocketMessage webSocketMessage = objectMapper.readValue(jsonStr, RedisWebSocketMessage.class);
            log.debug("[RedisWSListener] Received Redis broadcast for: {}", webSocketMessage.getDestination());
            
            // Deserialize back to generic Java object for SimpMessagingTemplate
            Object payloadObj = objectMapper.readValue(webSocketMessage.getPayloadJson(), Object.class);
            
            // Set header FROM_REDIS to prevent local interceptor from republishing
            SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create();
            headerAccessor.setHeader("FROM_REDIS", true);
            
            messagingTemplate.convertAndSend(
                    webSocketMessage.getDestination(), 
                    payloadObj, 
                    headerAccessor.getMessageHeaders()
            );
        } catch (Exception e) {
            log.error("[RedisWSListener] Error dispatching broadcasted message: ", e);
        }
    }
}
