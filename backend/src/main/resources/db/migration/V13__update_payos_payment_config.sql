-- =============================================================================
-- DATABASE MIGRATION SCRIPT V13: UPDATE PAYOS & VIETQR PAYMENT CONFIG
-- Engine: PostgreSQL / Flyway
-- Account: MBBank - 0866739857 - TRAN HUNG TIN
-- =============================================================================

UPDATE payment_configs 
SET payos_client_id = COALESCE(NULLIF('PAYOS_CLIENT_ID', ''), payos_client_id),
    payos_api_key = COALESCE(NULLIF('PAYOS_API_KEY', ''), payos_api_key),
    payos_checksum_key = COALESCE(NULLIF('PAYOS_CHECKSUM_KEY', ''), payos_checksum_key),
    is_active = TRUE,
    update_at = CURRENT_TIMESTAMP
WHERE is_active = TRUE;

INSERT INTO payment_configs (payos_client_id, payos_api_key, payos_checksum_key, is_active, update_at)
SELECT 'PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM payment_configs);
