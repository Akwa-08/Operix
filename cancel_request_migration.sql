-- Migration: Add cancellation request support to orders table
-- Run this in your Supabase SQL editor

-- 1. Add cancel_reason column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL;

-- 2. Add 'cancel_requested' and 'cancelled' to the status enum (if using enum)
-- If your status column is a TEXT field, skip this step.
-- If it's an enum type, run:
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancel_requested';
-- ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';

-- NOTE: If the status column is VARCHAR/TEXT, no enum change needed.
-- The application will handle 'cancel_requested' and 'cancelled' as string values.
