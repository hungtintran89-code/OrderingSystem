-- V12: Bổ sung Index tối ưu hóa truy vấn danh sách đơn hàng và món ăn theo table_session
CREATE INDEX IF NOT EXISTS idx_orders_table_session_status ON orders(table_session_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
