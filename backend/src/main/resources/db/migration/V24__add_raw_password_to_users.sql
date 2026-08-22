-- Flyway Migration V24: Add raw_password column to users table for Admin management view
ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_password VARCHAR(255);

-- Set default raw password for existing seeded accounts
UPDATE users SET raw_password = 'admin123' WHERE raw_password IS NULL OR raw_password = '';
