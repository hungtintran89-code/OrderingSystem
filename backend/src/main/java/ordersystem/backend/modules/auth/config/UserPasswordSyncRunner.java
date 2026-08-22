package ordersystem.backend.modules.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ordersystem.backend.modules.auth.entity.User;
import ordersystem.backend.modules.auth.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Component tự động mã hóa và đồng bộ mật khẩu BCrypt chuẩn bằng PasswordEncoder cho các tài khoản mặc định
 * trong CSDL PostgreSQL ngay khi máy chủ Backend khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserPasswordSyncRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("[UserPasswordSyncRunner] Synchronizing valid BCrypt passwords for default accounts in PostgreSQL...");

        List<String> defaultAccounts = List.of("admin", "manager1", "cashier1", "cashier2", "staff1", "staff2", "staff3", "kitchen1", "kitchen2", "kitchen3");

        for (String username : defaultAccounts) {
            userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
                String freshHash = passwordEncoder.encode("admin123");
                user.setPasswordHash(freshHash);
                user.setRawPassword("admin123");
                user.setActive(true);
                userRepository.save(user);
                log.info("[UserPasswordSyncRunner] Successfully generated & saved fresh 60-char BCrypt hash for user: {}", username);
            });
        }
    }
}