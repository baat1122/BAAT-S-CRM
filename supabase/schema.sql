-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers Table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_id text unique not null,
  customer_id uuid references public.customers(id),
  vehicle_name text not null,
  pickup_location text not null,
  dropoff_location text not null,
  pickup_date date,
  delivery_date date,
  status text default 'Posted',
  lead_provider text,
  agent_name text,
  customer_price numeric,
  carrier_price numeric,
  profit numeric,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments Table
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id),
  payment_method text not null,
  amount_paid numeric not null,
  payment_date date default current_date,
  remaining_balance numeric,
  invoice_number text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (for staff)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text not null, -- 'Admin', 'Agent', 'Dispatcher', 'Accountant'
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
