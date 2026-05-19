-- 1. Create Team/Users Role Tracking (if using public users table)
-- We'll add a simple roles table or just add a column to public.users if we have one.
-- For simplicity, let's create a team_members table that links to auth.
CREATE TABLE public.team_members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid, -- Links to auth.users if needed
  name text not null,
  email text not null,
  phone text,
  role text default 'Sales Agent', -- 'Admin', 'Dispatcher', 'Sales Agent'
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- 2. Modify Leads (Quotes) Table
ALTER TABLE public.leads 
ADD COLUMN est_pickup_date date,
ADD COLUMN est_delivery_date date,
ADD COLUMN agent_id uuid references public.team_members(id);

-- Create Quote Vehicles Table
CREATE TABLE public.quote_vehicles (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads(id) on delete cascade,
  year text,
  make text,
  model text,
  vin text,
  operable boolean default true,
  trailer_type text default 'Open', -- 'Open' or 'Enclosed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.quote_vehicles DISABLE ROW LEVEL SECURITY;

-- 3. Modify Orders Table
ALTER TABLE public.orders 
ADD COLUMN est_pickup_date date,
ADD COLUMN est_delivery_date date,
ADD COLUMN agent_id uuid references public.team_members(id);

-- Create Order Vehicles Table
CREATE TABLE public.order_vehicles (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  year text,
  make text,
  model text,
  vin text,
  operable boolean default true,
  trailer_type text default 'Open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.order_vehicles DISABLE ROW LEVEL SECURITY;

-- 4. Modify Payments Table
ALTER TABLE public.payments 
ADD COLUMN sender_name text,
ADD COLUMN agent_id uuid references public.team_members(id);

-- 5. Create Files Table for Storage References
CREATE TABLE public.files (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null, -- 'carrier', 'order', 'quote'
  entity_id uuid not null,
  file_name text not null,
  file_url text not null,
  document_type text not null, -- 'Insurance', 'W9', 'Carrier Agreement', 'BOL', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;

-- Enable permissive RLS for all new tables just in case Supabase forces it
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.quote_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all quote_vehicles" ON public.quote_vehicles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.order_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all order_vehicles" ON public.order_vehicles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all files" ON public.files FOR ALL USING (true) WITH CHECK (true);
