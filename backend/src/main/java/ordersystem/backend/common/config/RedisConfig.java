package ordersystem.backend.common.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String , Object > redisTemplate (RedisConnectionFactory connectionFactory ){

        RedisTemplate<String , Object > template = new RedisTemplate<>() ;

        // Kết nối tới Redis Server (Docker Container)
        template.setConnectionFactory( connectionFactory );

        // Đổi bộ mã hóa Key thành Dạng Chuỗi Chữ (String)
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer( new StringRedisSerializer());

        // Đổi bộ mã hóa Value thành Dạng Chuỗi JSON (Jackson)
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;

    }
}
