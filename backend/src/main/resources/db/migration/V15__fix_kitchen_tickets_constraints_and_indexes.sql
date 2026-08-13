-- Migration V15: Fix Kitchen Tickets Constraints and Add Performance Indexes
-- Ensures PostgreSQL Database supports flexible kitchen tickets without hard NOT NULL constraints on order_item_id

-- 1. Drop UNIQUE constraint on order_item_id if exists to allow safe retries
ALTER TABLE kitchen_tickets DROP CONSTRAINT IF EXISTS kitchen_tickets_order_item_id_key;

-- 2. Allow order_item_id to be NULL as fallback
ALTER TABLE kitchen_tickets ALTER COLUMN order_item_id DROP NOT NULL;

-- 3. Add performance indexes for fast KDS queries by status and order_id
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order_id ON kitchen_tickets(order_id);
