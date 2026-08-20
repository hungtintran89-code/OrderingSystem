-- Flyway Migration V23: Optimization of indexes for Payment Transactions & Takeaway Webhook reconciliation
CREATE INDEX IF NOT EXISTS idx_payment_tx_payos_status ON payment_transactions(payos_order_code, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status_type ON payment_transactions(payment_status, order_type);
