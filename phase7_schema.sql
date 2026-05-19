-- Add custom_order_id column to leads table
-- This allows users to assign any custom ID/reference to a quote
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_order_id text;
