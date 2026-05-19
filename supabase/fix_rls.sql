-- This script disables Row Level Security (RLS) on all tables
-- This allows our application to read and write data without encountering the "new row violates row-level security policy" error.

-- Disable RLS on customers
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on orders
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on payments
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
