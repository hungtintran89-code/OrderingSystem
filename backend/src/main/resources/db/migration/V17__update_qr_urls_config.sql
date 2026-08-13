-- DATABASE MIGRATION SCRIPT V17: UPDATE QR CODE RESOLVE URL FORMAT
-- Standardize existing seed table QR URLs to use the backend QR resolve endpoint

UPDATE tables 
SET qr_url = CONCAT('http://localhost:8080/api/v1/qr/resolve/', qr_token)
WHERE qr_token IS NOT NULL AND qr_token != '';
