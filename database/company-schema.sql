-- Company management tables for POS system
-- Run this in Supabase SQL Editor

-- Companies table to store business information
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cvr text unique not null check (length(cvr) = 8),
  address text not null,
  city text not null,
  postal_code text not null check (length(postal_code) = 4),
  country text not null default 'DK',
  phone text,
  email text,
  website text,
  vat_number text,
  logo_url text,
  receipt_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User profiles table to link auth.users with companies
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  role text not null default 'admin' check (role in ('admin', 'manager', 'cashier')),
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update trigger for companies
drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated 
  before update on public.companies 
  for each row execute procedure public.set_updated_at();

-- Update trigger for user_profiles
drop trigger if exists trg_user_profiles_updated on public.user_profiles;
create trigger trg_user_profiles_updated 
  before update on public.user_profiles 
  for each row execute procedure public.set_updated_at();

-- RLS (Row Level Security) policies
alter table public.companies enable row level security;
alter table public.user_profiles enable row level security;

-- Companies: Users can only see their own company
create policy "Users can view own company" on public.companies
  for select using (
    id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

create policy "Users can update own company" on public.companies
  for update using (
    id in (
      select company_id from public.user_profiles 
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- User profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.user_profiles
  for select using (id = auth.uid());

create policy "Users can update own profile" on public.user_profiles
  for update using (id = auth.uid());

create policy "Users can insert own profile" on public.user_profiles
  for insert with check (id = auth.uid());

-- Function to get current user's company
create or replace function public.get_current_company()
returns table (
  id uuid,
  name text,
  cvr text,
  address text,
  city text,
  postal_code text,
  country text,
  phone text,
  email text,
  website text,
  vat_number text,
  logo_url text,
  receipt_message text
) language sql security definer as $$
  select c.id, c.name, c.cvr, c.address, c.city, c.postal_code,
         c.country, c.phone, c.email, c.website, c.vat_number, c.logo_url, c.receipt_message
  from public.companies c
  join public.user_profiles up on c.id = up.company_id
  where up.id = auth.uid();
$$;

-- Function to create company and link to user
create or replace function public.create_company_with_user(
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
  -- Check if user is authenticated
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
  
  -- Create or update user profile
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
