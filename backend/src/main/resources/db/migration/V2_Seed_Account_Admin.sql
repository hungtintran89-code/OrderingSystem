INSERT INTO users (username, password_hash, fullname, role, is_active, created_at)
VALUES (
           'admin',
           '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0R1v52W.yA3e4a', -- Mật khẩu mặc định: admin123
           'System Manager',
           'MANAGER',
           true,
           CURRENT_TIMESTAMP
       )
    ON CONFLICT (username) DO NOTHING;