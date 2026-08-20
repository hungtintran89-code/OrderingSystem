-- V22__add_items_json_to_payment_transactions.sql
-- Add items_json column to payment_transactions table to store item details for Takeaway VietQR payments

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS items_json TEXT;
