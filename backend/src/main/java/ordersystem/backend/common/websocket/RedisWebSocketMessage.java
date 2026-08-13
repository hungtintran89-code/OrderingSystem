package ordersystem.backend.common.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedisWebSocketMessage implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String destination;
    private String payloadJson;
}
