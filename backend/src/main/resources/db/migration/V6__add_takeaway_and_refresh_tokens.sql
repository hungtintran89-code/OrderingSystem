-- =============================================================================
-- DATABASE MIGRATION SCRIPT V6 FOR COMMERCIAL ORDERING SYSTEM
-- Engine: PostgreSQL
-- Framework: Flyway / Spring Data JPA
-- Description: Bổ sung cột Đơn Mang Về (Takeaway), Gạch món lẻ KDS, và Bảng Refresh Tokens
-- Note: KHÔNG SỬ DỤNG VAT (Zero-VAT Policy)
-- =============================================================================

-- 1. Bổ sung thông tin Đơn Mang Về (Takeaway) vào bảng orders (KHÔNG LƯU VAT)
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) DEFAULT 'DINE_IN',
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) DEFAULT NULL;

-- 2. Thêm trường gạch món lẻ KDS vào bảng order_items
ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- 3. Tạo bảng lưu trữ Refresh Tokens phục vụ cơ chế Security Token Rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index phục vụ tra cứu nhanh Refresh Token theo Token và User ID
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
