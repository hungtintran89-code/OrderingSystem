-- =============================================================================
-- DATABASE MIGRATION SCRIPT V19 FOR COMMERCIAL ORDERING SYSTEM
-- Engine: PostgreSQL
-- Framework: Flyway / Spring Data JPA
-- Description: Bổ sung các trường thanh toán và phân loại đơn Takeaway trong bảng orders
-- =============================================================================

-- 1. Bổ sung các cột payment_method, payment_status, order_type vào bảng orders
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) DEFAULT 'DINE_IN';

-- 2. Đảm bảo các chỉ mục tìm kiếm và lọc lịch sử đơn hàng
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
