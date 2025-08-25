-- Ensure Company and User Profile Tables Exist
-- Run this in Supabase SQL Editor to create the required tables

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cvr text UNIQUE NOT NULL CHECK (length(cvr) = 8),
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL CHECK (length(postal_code) = 4),
  country text NOT NULL DEFAULT 'DK',
  phone text,
  email text,
  website text,
  vat_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'cashier')),
  first_name text,
  last_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create the set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Create update triggers
DROP TRIGGER IF EXISTS trg_companies_updated ON public.companies;
CREATE TRIGGER trg_companies_updated 
  BEFORE UPDATE ON public.companies 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Test queries
SELECT 'Companies table' as table_name, COUNT(*) as count FROM public.companies;
SELECT 'User profiles table' as table_name, COUNT(*) as count FROM public.user_profiles;
