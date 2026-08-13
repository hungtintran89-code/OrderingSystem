package ordersystem.backend.common.websocket;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.support.AbstractSubscribableChannel;
import org.springframework.messaging.support.ChannelInterceptor;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class RedisWebSocketInterceptorRegister {

    @Autowired
    @Qualifier("brokerChannel")
    private AbstractSubscribableChannel brokerChannel;

    private final RedisWebSocketPublisher redisPublisher;

    @PostConstruct
    public void registerInterceptor() {
        log.info("[RedisWSInterceptor] Registering Redis clustered message broker interceptor on brokerChannel...");
        
        brokerChannel.addInterceptor(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(message);
                
                // Only intercept application messages (Server sending to Clients)
                if (SimpMessageType.MESSAGE.equals(accessor.getMessageType())) {
                    String destination = accessor.getDestination();
                    
                    if (destination != null && destination.startsWith("/topic/")) {
                        Object fromRedis = accessor.getHeader("FROM_REDIS");
                        
                        // If this message was not sent from Redis, publish to Redis and cancel the local dispatch
                        if (fromRedis == null || !((Boolean) fromRedis)) {
                            redisPublisher.publish(destination, message.getPayload());
                            return null; // Stop local dispatching of the message
                        }
                    }
                }
                return message; // Let it dispatch normally if it has the FROM_REDIS header or is a control message
            }
        });
    }
}
