-- =============================================================================
-- DATABASE MIGRATION SCRIPT V2: ADVANCED INDEXING FOR PERFORMANCE
-- Framework: Flyway / PostgreSQL
-- =============================================================================

-- 1. Index cho Bảng orders (Tối ưu tra cứu đơn hàng theo bàn & màn hình bếp KDS)
CREATE INDEX IF NOT EXISTS idx_orders_session_status
    ON orders (table_session_id, status);

-- Partial Index cho KDS: Bếp chỉ quan tâm các đơn PENDING, PREPARING, READY
CREATE INDEX IF NOT EXISTS idx_orders_kds_active
    ON orders (created_at ASC)
    WHERE status IN ('PENDING', 'PREPARING', 'READY');

-- 2. Index cho Bảng products (Tối ưu lấy thực đơn theo danh mục)
CREATE INDEX IF NOT EXISTS idx_products_category_available
    ON products (category_id, product_is_available);

-- 3. Ràng buộc & Index cho Bảng table_sessions
-- Đảm bảo 1 bàn tại 1 thời điểm chỉ có ĐÚNG 1 session ACTIVE
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_active_unique
    ON table_sessions (table_id)
    WHERE status = 'ACTIVE';

-- 4. Index cho Bảng service_requests (Tối ưu chuông gọi phục vụ)
CREATE INDEX IF NOT EXISTS idx_service_requests_pending
    ON service_requests (created_at ASC)
    WHERE request_status = 'PENDING';