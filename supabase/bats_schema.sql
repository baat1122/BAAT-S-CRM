-- 1. Create Carriers Table
create table public.carriers (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  mc_number text,
  dot_number text,
  dispatcher_name text,
  dispatcher_phone text,
  dispatcher_email text,
  insurance_expiration date,
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable RLS for Carriers
ALTER TABLE public.carriers DISABLE ROW LEVEL SECURITY;

-- 2. Create Leads Table (for Quotes)
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  phone text,
  email text,
  vehicle_name text not null,
  pickup_location text not null,
  dropoff_location text not null,
  estimated_price numeric,
  status text default 'New', -- 'New', 'Quoted', 'Follow Up', 'Converted', 'Dead'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable RLS for Leads
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- 3. Update Orders Table to link to Carriers
ALTER TABLE public.orders ADD COLUMN carrier_id uuid references public.carriers(id);
