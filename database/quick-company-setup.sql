-- Quick Company Setup - Run this in Supabase SQL Editor
-- Minimal setup to fix the "table not found" error

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT 'My Restaurant',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (ignore errors)
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.user_profiles;

-- Simple policies
CREATE POLICY "Allow authenticated users to read companies" ON public.companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

-- Insert default company
INSERT INTO public.companies (name) 
SELECT 'My Restaurant'
WHERE NOT EXISTS (SELECT 1 FROM public.companies);

-- Test
SELECT 'Tables created successfully!' as result;
