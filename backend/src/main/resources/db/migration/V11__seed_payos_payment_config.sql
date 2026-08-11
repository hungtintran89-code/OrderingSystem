-- =============================================================================
-- DATABASE MIGRATION SCRIPT V11: SEED PAYOS & VIETQR PAYMENT CONFIG
-- Engine: PostgreSQL / Flyway
-- Account: MBBank - 0866739857 - TRAN HUNG TIN
-- =============================================================================

INSERT INTO payment_configs (payos_client_id, payos_api_key, payos_checksum_key, is_active, update_at)
SELECT 'PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM payment_configs WHERE is_active = TRUE);
