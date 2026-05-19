-- Add source column to leads and orders
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'Website';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'Website';

-- Add routes column to carriers
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS routes text;

-- Add sender_name column to payments just in case we want to save it persistently
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sender_name text;
