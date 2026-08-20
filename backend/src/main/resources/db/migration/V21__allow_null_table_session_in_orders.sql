-- V21__allow_null_table_session_in_orders.sql
-- Allow table_session_id to be NULL for Takeaway (Mang Về) orders in orders table
-- Allow created_by_thread to be NULL for order_items table

ALTER TABLE orders ALTER COLUMN table_session_id DROP NOT NULL;
ALTER TABLE order_items ALTER COLUMN created_by_thread DROP NOT NULL;
