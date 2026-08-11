-- Migration V9: Tạo bảng lưu trữ thông tin Khu Vực (Zone) bàn ăn
CREATE TABLE IF NOT EXISTS table_zones (
    zone_id BIGSERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed các khu vực mặc định
INSERT INTO table_zones (zone_name, display_order) VALUES
('Tầng trệt', 1),
('Tầng 1', 2),
('Tầng 2', 3),
('VIP', 4)
ON CONFLICT (zone_name) DO NOTHING;
