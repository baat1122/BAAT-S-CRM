-- 1. Explicitly disable RLS on the new tables
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers DISABLE ROW LEVEL SECURITY;

-- 2. If Supabase forces RLS to stay on, these policies will allow all operations
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all access to carriers" ON public.carriers;

-- Enable RLS just in case the dashboard requires it
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies allowing anyone to read, insert, update, and delete
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to carriers" ON public.carriers FOR ALL USING (true) WITH CHECK (true);
