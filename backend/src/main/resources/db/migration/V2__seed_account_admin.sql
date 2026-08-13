INSERT INTO users (username, password_hash, fullname, role, is_active, created_at)
VALUES (
           'admin',
           '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4aE', -- Mật khẩu mặc định: admin123 (60-char valid BCrypt hash)
           'System Manager',
           'MANAGER',
           true,
           CURRENT_TIMESTAMP
       )
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;