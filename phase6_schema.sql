-- Add is_archived column to main tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
