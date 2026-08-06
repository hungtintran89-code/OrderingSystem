package ordersystem.backend.common.config;


import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@Cacheable
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

    @Bean
    public RedisCacheManager cacheManager ( RedisConnectionFactory connectionFactory ){

        // Cấu hình chuẩn: Chuyển đổi Java Object sang JSON chữ rõ ràng khi lưu vào Redis
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // TTL mặc định cho các cache khác là 10 phút
                .disableCachingNullValues() // Không lưu giá trị null vào cache
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer( new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())) ;

        // Tùy chỉnh TTL riêng cho từng Cache Name
        Map<String , RedisCacheConfiguration> cacheConfigurations = new HashMap<>() ;

        // Cache danh mục thực đơn ('categories') lưu trong 30 phút
        cacheConfigurations.put( "categories" , defaultCacheConfig.entryTtl(Duration.ofMinutes(30))) ;

        // Cache thông tin 1 món ('single_product') lưu trong 1 giờ
        cacheConfigurations.put( "single_product" , defaultCacheConfig.entryTtl(Duration.ofMinutes(60))) ;

        return RedisCacheManager.builder( connectionFactory )
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations( cacheConfigurations)
                .build() ;

    }


}
