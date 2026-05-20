-- Phase 11: Customer Order Confirmation Portal
-- Run this in your Supabase SQL Editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pickup_contact_name text,
  ADD COLUMN IF NOT EXISTS pickup_contact_phone text,
  ADD COLUMN IF NOT EXISTS dropoff_contact_name text,
  ADD COLUMN IF NOT EXISTS dropoff_contact_phone text,
  ADD COLUMN IF NOT EXISTS customer_signature text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS form_submitted boolean DEFAULT false;
