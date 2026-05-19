-- Phase 10: Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'NEON AUTO TRANSPORT',
  support_phone text NOT NULL DEFAULT '(571) 576-7711',
  business_address text NOT NULL DEFAULT '2709 Neabsco Common Pl suit#101, Woodbridge Virginia 22191',
  timezone text NOT NULL DEFAULT 'Eastern Time (EST)',
  default_currency text NOT NULL DEFAULT 'USD ($)',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert a default row if table is empty
INSERT INTO company_settings (company_name)
SELECT 'NEON AUTO TRANSPORT'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);
