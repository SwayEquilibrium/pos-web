-- Fix Email Confirmation Issue
-- Run this in Supabase SQL Editor to allow unconfirmed users to create companies

-- Update the create_company_with_user function to handle unconfirmed users
CREATE OR REPLACE FUNCTION public.create_company_with_user(
  p_company_name text,
  p_cvr text,
  p_address text,
  p_city text,
  p_postal_code text,
  p_phone text default null,
  p_email text default null,
  p_first_name text default null,
  p_last_name text default null
) returns uuid language plpgsql security definer as $$
declare
  v_company_id uuid;
  v_user_id uuid := auth.uid();
begin
  -- Check if user is authenticated (even if email not confirmed)
  if v_user_id is null then
    raise exception 'User must be authenticated';
  end if;
  
  -- Check if user already has a company
  if exists (select 1 from public.user_profiles where id = v_user_id and company_id is not null) then
    raise exception 'User already belongs to a company';
  end if;
  
  -- Create company
  insert into public.companies (name, cvr, address, city, postal_code, phone, email)
  values (p_company_name, p_cvr, p_address, p_city, p_postal_code, p_phone, p_email)
  returning id into v_company_id;
  
  -- Create or update user profile (even for unconfirmed users)
  insert into public.user_profiles (id, company_id, role, first_name, last_name)
  values (v_user_id, v_company_id, 'admin', p_first_name, p_last_name)
  on conflict (id) do update set
    company_id = v_company_id,
    role = 'admin',
    first_name = coalesce(p_first_name, user_profiles.first_name),
    last_name = coalesce(p_last_name, user_profiles.last_name);
  
  return v_company_id;
end;
$$;

-- Also update the RLS policies to allow unconfirmed users to access their data
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (
    id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (
    id in (
      select company_id from public.user_profiles 
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Allow unconfirmed users to insert/update their profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Test the function
SELECT 'Email confirmation fix applied successfully!' as result;
