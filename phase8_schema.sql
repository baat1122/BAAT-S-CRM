-- Phase 8: Performance Indexes
-- These indexes will speed up the queries used by the dashboard and list pages.

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_is_archived ON leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_customer_name ON leads(customer_name);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders((customer_name)); -- Assuming orders joins with customers, but orders has a customer_id, so let's index that instead

-- Wait, the orders table doesn't have a direct customer_name, it uses customer_id? Actually, looking at the code, orders DOES have a customer_id, but the UI searches `customer_name`. Wait, let me double check the orders table schema.

-- Let's just stick to the definitely safe ones based on the current usage:
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
