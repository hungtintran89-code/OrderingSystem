package ordersystem.backend.common.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Slf4j
@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Bean
    @Primary
    public RedissonClient redissonClient() {
        try {
            Config config = new Config();
            String address = "redis://" + redisHost + ":" + redisPort;
            config.useSingleServer()
                    .setAddress(address)
                    .setConnectTimeout(1500)
                    .setRetryAttempts(1)
                    .setRetryInterval(500);

            log.info("[RedissonConfig] Thử kết nối Redisson tới {}", address);
            RedissonClient client = Redisson.create(config);
            // Thử ping connection
            client.getNodesGroup().pingAll();
            log.info("[RedissonConfig] Kết nối Redisson Redis thành công!");
            return client;
        } catch (Exception e) {
            log.warn("[RedissonConfig] Không thể kết nối Redis Server tại {}:6379 ({}). Khởi tạo Redisson Mock Fallback cho môi trường Local Dev.",
                    redisHost, e.getMessage());

            // Trả về RedissonClient Fallback không gây crash ứng dụng khi chưa bật Redis Docker ở local
            return (RedissonClient) java.lang.reflect.Proxy.newProxyInstance(
                    RedissonClient.class.getClassLoader(),
                    new Class<?>[]{RedissonClient.class},
                    (proxy, method, args) -> {
                        String methodName = method.getName();
                        if ("getConfig".equals(methodName)) {
                            Config mockConfig = new Config();
                            mockConfig.useSingleServer().setAddress("redis://" + redisHost + ":" + redisPort);
                            return mockConfig;
                        }
                        if ("getLock".equals(methodName)) {
                            return createMockLock();
                        }
                        if ("getRateLimiter".equals(methodName)) {
                            return createMockRateLimiter();
                        }
                        if ("isShutdown".equals(methodName) || "isTerminated".equals(methodName)) {
                            return false;
                        }
                        if ("shutdown".equals(methodName)) {
                            return null;
                        }
                        // Default fallback return values
                        Class<?> returnType = method.getReturnType();
                        if (returnType.equals(boolean.class) || returnType.equals(Boolean.class)) return true;
                        if (returnType.equals(int.class) || returnType.equals(Integer.class)) return 0;
                        if (returnType.equals(long.class) || returnType.equals(Long.class)) return 0L;
                        return null;
                    }
            );
        }
    }

    private static Object createMockLock() {
        return java.lang.reflect.Proxy.newProxyInstance(
                RedissonConfig.class.getClassLoader(),
                new Class<?>[]{org.redisson.api.RLock.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("tryLock".equals(name)) return true;
                    if ("isLocked".equals(name)) return false;
                    if ("isHeldByCurrentThread".equals(name)) return true;
                    if ("unlock".equals(name)) return null;
                    if ("lock".equals(name)) return null;
                    Class<?> returnType = method.getReturnType();
                    if (returnType.equals(boolean.class) || returnType.equals(Boolean.class)) return true;
                    return null;
                }
        );
    }

    private static Object createMockRateLimiter() {
        return java.lang.reflect.Proxy.newProxyInstance(
                RedissonConfig.class.getClassLoader(),
                new Class<?>[]{org.redisson.api.RRateLimiter.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("tryAcquire".equals(name)) return true;
                    if ("isExists".equals(name)) return true;
                    if ("trySetRate".equals(name)) return true;
                    if ("expire".equals(name)) return true;
                    Class<?> returnType = method.getReturnType();
                    if (returnType.equals(boolean.class) || returnType.equals(Boolean.class)) return true;
                    return null;
                }
        );
    }
}
