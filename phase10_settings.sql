-- Phase 10: Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Best American Auto Transport',
  support_phone text NOT NULL DEFAULT '(832) 844-3246',
  business_address text NOT NULL DEFAULT '254 Chapman Rd, Ste 208 #18857, Newark, DE 19702',
  timezone text NOT NULL DEFAULT 'Eastern Time (EST)',
  default_currency text NOT NULL DEFAULT 'USD ($)',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert a default row if table is empty
INSERT INTO company_settings (company_name)
SELECT 'Best American Auto Transport'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);
