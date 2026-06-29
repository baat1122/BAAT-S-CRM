-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Core Tables
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name text NOT NULL,
  phone text,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.carriers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name text NOT NULL,
  mc_number text,
  dot_number text,
  dispatcher_name text,
  dispatcher_phone text,
  dispatcher_email text,
  insurance_expiration date,
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid, -- Links to auth.users if needed
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text DEFAULT 'Sales Agent', -- 'Admin', 'Dispatcher', 'Sales Agent'
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL, -- 'Admin', 'Agent', 'Dispatcher', 'Accountant'
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Leads (Quotes) Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name text NOT NULL,
  phone text,
  email text,
  vehicle_name text NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  estimated_price numeric,
  status text DEFAULT 'New', -- 'New', 'Quoted', 'Follow Up', 'Converted', 'Dead'
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  vehicle_name text NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  pickup_date date,
  delivery_date date,
  status text DEFAULT 'Posted',
  lead_provider text,
  agent_name text,
  customer_price numeric,
  carrier_price numeric,
  profit numeric,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id),
  payment_method text NOT NULL,
  amount_paid numeric NOT NULL,
  payment_date date DEFAULT current_date,
  remaining_balance numeric,
  invoice_number text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Add Alterations and Relations
-- Add carrier_id and agent_id references to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES public.carriers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.team_members(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS est_pickup_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS est_delivery_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'Website';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_logs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_contact_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_contact_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropoff_contact_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropoff_contact_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_signature text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS form_submitted boolean DEFAULT false;

-- Add custom_order_id, est_pickup_date, est_delivery_date, agent_id, source, is_archived to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_order_id text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS est_pickup_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS est_delivery_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.team_members(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'Website';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add routes to carriers
ALTER TABLE public.carriers ADD COLUMN IF NOT EXISTS routes text;

-- Add sender_name, agent_id, is_archived to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.team_members(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- 6. Create Vehicle tables
CREATE TABLE IF NOT EXISTS public.quote_vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  year text,
  make text,
  model text,
  vin text,
  operable boolean DEFAULT true,
  trailer_type text DEFAULT 'Open', -- 'Open' or 'Enclosed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  year text,
  make text,
  model text,
  vin text,
  operable boolean DEFAULT true,
  trailer_type text DEFAULT 'Open',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Files Table
CREATE TABLE IF NOT EXISTS public.files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type text NOT NULL, -- 'carrier', 'order', 'quote'
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  document_type text NOT NULL, -- 'Insurance', 'W9', 'Carrier Agreement', 'BOL', etc.
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Best American Auto Transport',
  support_phone text NOT NULL DEFAULT '(832) 844-3246',
  business_address text NOT NULL DEFAULT '254 Chapman Rd, Ste 208 #18857, Newark, DE 19702',
  timezone text NOT NULL DEFAULT 'Eastern Time (EST)',
  default_currency text NOT NULL DEFAULT 'USD ($)',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings row if empty
INSERT INTO public.company_settings (company_name)
SELECT 'Best American Auto Transport'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- 9. Create RPC Functions
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
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

-- 10. Disable RLS (Row Level Security) / Set permissive policies
-- This ensures the CRM client can query public tables without Auth Session headers (since we bypassed login)
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;

-- 11. Create Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_leads_is_archived ON public.leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_customer_name ON public.leads(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON public.orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
