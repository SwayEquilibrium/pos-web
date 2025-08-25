-- Minimal Company Setup - Run this in Supabase SQL Editor
-- This creates just the essential tables without complex features

-- Create companies table (minimal version)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT 'My Restaurant',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_profiles table (minimal version)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert a default company if none exists
INSERT INTO public.companies (name) 
SELECT 'My Restaurant'
WHERE NOT EXISTS (SELECT 1 FROM public.companies);

-- Create a profile for the current user if logged in and none exists
DO $$
DECLARE
  current_user_id uuid;
  default_company_id uuid;
BEGIN
  -- Get the current user (if any)
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    -- Get the default company
    SELECT id INTO default_company_id FROM public.companies LIMIT 1;
    
    -- Create profile for current user if it doesn't exist
    INSERT INTO public.user_profiles (id, company_id, role)
    VALUES (current_user_id, default_company_id, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Simple policies (no complex RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read companies (simplified)
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON public.companies;
CREATE POLICY "Allow authenticated users to read companies" ON public.companies
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to read profiles (simplified)  
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

-- Test the setup
SELECT 'Setup complete!' as status, 
       (SELECT COUNT(*) FROM public.companies) as companies_count,
       (SELECT COUNT(*) FROM public.user_profiles) as profiles_count;
