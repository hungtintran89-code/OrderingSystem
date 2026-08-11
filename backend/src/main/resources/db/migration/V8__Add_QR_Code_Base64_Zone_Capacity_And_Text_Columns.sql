-- Migration V8: Synchronize product TEXT column extensions and table QR code Base64, zone, capacity columns

-- 1. Extend products image URL and description column lengths to TEXT for Base64 images & long descriptions
ALTER TABLE products ALTER COLUMN product_image_url TYPE TEXT;
ALTER TABLE products ALTER COLUMN product_description TYPE TEXT;

-- 2. Add QR Code Base64 image, zone, and capacity columns to tables table
ALTER TABLE tables ADD COLUMN IF NOT EXISTS qr_image_base64 TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT 'Tầng 1';
ALTER TABLE tables ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 4;
