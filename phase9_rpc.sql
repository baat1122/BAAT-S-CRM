-- Phase 9: Dashboard RPC Functions
-- This function calculates dashboard statistics directly on the database to avoid fetching thousands of rows into the Next.js server.

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_profit numeric;
  v_orders_count int;
  v_active_orders int;
  v_customers_count int;
  v_recent_orders json;
  v_result json;
BEGIN
  -- Total Profit (excluding cancelled)
  SELECT COALESCE(SUM(profit), 0) INTO v_total_profit 
  FROM orders 
  WHERE status ILIKE 'cancelled' IS FALSE;

  -- Total Orders
  SELECT COUNT(*) INTO v_orders_count 
  FROM orders 
  WHERE is_archived = false;

  -- Active Orders
  SELECT COUNT(*) INTO v_active_orders 
  FROM orders 
  WHERE status ILIKE 'delivered' IS FALSE 
    AND status ILIKE 'cancelled' IS FALSE 
    AND is_archived = false;

  -- Total Customers
  SELECT COUNT(*) INTO v_customers_count 
  FROM customers;

  -- Recent Orders (Last 5)
  SELECT json_agg(row_to_json(ro)) INTO v_recent_orders
  FROM (
    SELECT * FROM orders 
    WHERE is_archived = false 
    ORDER BY created_at DESC 
    LIMIT 5
  ) ro;

  -- Build Result JSON
  v_result := json_build_object(
    'total_profit', v_total_profit,
    'orders_count', v_orders_count,
    'active_orders', v_active_orders,
    'customers_count', v_customers_count,
    'recent_orders', COALESCE(v_recent_orders, '[]'::json)
  );

  RETURN v_result;
END;
$$;
