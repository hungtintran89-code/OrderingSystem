-- Flyway Migration V20: Tối ưu bảng payment_transactions hỗ trợ đơn Mang về (Takeaway) và tránh xung đột với đơn tại bàn
ALTER TABLE payment_transactions ALTER COLUMN table_session_id DROP NOT NULL;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'DINE_IN';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS order_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_tx_payos_code ON payment_transactions(payos_order_code);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order_type ON payment_transactions(order_type);
