-- V7 Migration: Add salary column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(15, 2) DEFAULT 7500000.00;
