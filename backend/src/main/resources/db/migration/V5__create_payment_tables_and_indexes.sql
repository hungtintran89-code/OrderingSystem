-- =============================================================================
-- DATABASE MIGRATION SCRIPT V5: MODULE PAYMENT & INDEX OPTIMIZATION
-- Engine: PostgreSQL
-- Framework: Flyway / Spring Data JPA
-- Module: Payment (Payment Configs, Payment Transactions & Performance Indexes)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BẢNG PAYMENT_CONFIGS
-- Lưu cấu hình tích hợp cổng thanh toán PayOS (Client ID, API Key, Checksum Key)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_configs (
    config_id          BIGSERIAL PRIMARY KEY,
    payos_client_id    VARCHAR(255) NOT NULL,
    payos_api_key       VARCHAR(255) NOT NULL,
    payos_checksum_key  VARCHAR(255) DEFAULT NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    update_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index tối ưu tra cứu cấu hình active
CREATE INDEX IF NOT EXISTS idx_payment_configs_active 
    ON payment_configs(is_active) 
    WHERE is_active = TRUE;


-- -----------------------------------------------------------------------------
-- 2. BẢNG PAYMENT_TRANSACTIONS
-- Lưu lịch sử giao dịch thanh toán (Tiền mặt, VietQR PayOS) cho các Table Session
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    payment_id        BIGSERIAL PRIMARY KEY,
    invoice_code      VARCHAR(255) NOT NULL UNIQUE,
    table_session_id  BIGINT       NOT NULL,
    total_amount      BIGINT       NOT NULL,
    receive_amount    BIGINT       DEFAULT NULL,
    change_amount     BIGINT       DEFAULT NULL,
    payment_method    VARCHAR(50)  NOT NULL,
    payment_status    VARCHAR(50)  NOT NULL,
    payos_order_code  BIGINT       DEFAULT NULL,
    qr_url            VARCHAR(1000) DEFAULT NULL,
    paid_at           TIMESTAMP    DEFAULT NULL,
    create_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payment_transactions_session
        FOREIGN KEY (table_session_id)
        REFERENCES table_sessions(table_session_id)
        ON DELETE RESTRICT
);


-- -----------------------------------------------------------------------------
-- 3. TỐI ƯU HÓA HIỆU NĂNG INDEXES CHO MODULE PAYMENT
-- -----------------------------------------------------------------------------

-- 3.1. Index tra cứu O(1) theo payos_order_code phục vụ Webhook xử lý cực nhanh
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_payos_order_code 
    ON payment_transactions(payos_order_code) 
    WHERE payos_order_code IS NOT NULL;

-- 3.2. Composite Index tối ưu kiểm tra transaction theo session & trạng thái
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_status 
    ON payment_transactions(table_session_id, payment_status);

-- 3.3. Partial Index cho các transaction đang PENDING (tối ưu xử lý hủy/tạo lại QR)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pending 
    ON payment_transactions(table_session_id) 
    WHERE payment_status = 'PENDING';

-- 3.4. Index hỗ trợ truy vấn thống kê báo cáo theo thời gian & trạng thái
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created 
    ON payment_transactions(payment_status, create_at DESC);
