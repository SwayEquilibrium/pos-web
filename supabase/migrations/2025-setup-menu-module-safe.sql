-- ================================================
-- MENU MODULE MIGRATION (SAFE VERSION)
-- Creates scalable menu management system
-- Handles existing tables and policies gracefully
-- 
-- This migration will:
-- 1. Create new tables if they don't exist
-- 2. Add missing columns to existing tables
-- 3. Create policies only if they don't exist
-- 4. Handle both old and new schema versions
-- 5. Populate default data safely
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================
-- TAX CODES (extend existing if needed)
-- ================================================
do $$
begin
  -- Create table if it doesn't exist
  if not exists (select 1 from information_schema.tables where table_name = 'tax_codes' and table_schema = 'public') then
    create table public.tax_codes (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      code text not null,
      rate numeric(6,3) not null,
      description text,
      active boolean not null default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(name)
    );
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'tax_codes' and column_name = 'code') then
      alter table public.tax_codes add column code text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tax_codes' and column_name = 'description') then
      alter table public.tax_codes add column description text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tax_codes' and column_name = 'active') then
      alter table public.tax_codes add column active boolean not null default true;
    end if;
  end if;
end $$;

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'tax_codes' and policyname = 'Allow all operations on tax_codes') then
    create policy "Allow all operations on tax_codes" on public.tax_codes for all using (true);
  end if;
end $$;

-- ================================================
-- PRODUCT GROUPS
-- ================================================
create table if not exists public.product_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sort_index int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'product_groups' and policyname = 'Allow all operations on product_groups') then
    create policy "Allow all operations on product_groups" on public.product_groups for all using (true);
  end if;
end $$;

-- ================================================
-- CATEGORIES (extend existing if needed)
-- ================================================
do $$
begin
  -- Create table if it doesn't exist
  if not exists (select 1 from information_schema.tables where table_name = 'categories' and table_schema = 'public') then
    create table public.categories (
      id uuid primary key default uuid_generate_v4(),
      parent_id uuid references public.categories(id) on delete set null,
      name text not null,
      description text,
      sort_index int not null default 0,
      print_sort_index int not null default 0,
      active boolean not null default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  end if;
  
  -- Add missing columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'description') then
    alter table public.categories add column description text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'active') then
    alter table public.categories add column active boolean not null default true;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'sort_index') then
    alter table public.categories add column sort_index int not null default 0;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'print_sort_index') then
    alter table public.categories add column print_sort_index int not null default 0;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'created_at') then
    alter table public.categories add column created_at timestamptz default now();
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'updated_at') then
    alter table public.categories add column updated_at timestamptz default now();
  end if;
end $$;

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'Allow all operations on categories') then
    create policy "Allow all operations on categories" on public.categories for all using (true);
  end if;
end $$;

-- ================================================
-- PRODUCTS (extend existing if needed)
-- ================================================
do $$
begin
  -- Create table if it doesn't exist
  if not exists (select 1 from information_schema.tables where table_name = 'products' and table_schema = 'public') then
    create table public.products (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      category_id uuid references public.categories(id) on delete set null,
      product_group_id uuid references public.product_groups(id) on delete set null,
      description text,
      active boolean not null default true,
      color text,
      emoji text,
      display_style text,
      image_url text,
      image_thumbnail_url text,
      allergens text[],
      nutritional_info jsonb,
      sort_index int not null default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'product_group_id') then
      alter table public.products add column product_group_id uuid references public.product_groups(id) on delete set null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'active') then
      alter table public.products add column active boolean not null default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'sort_index') then
      alter table public.products add column sort_index int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'created_at') then
      alter table public.products add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'updated_at') then
      alter table public.products add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'Allow all operations on products') then
    create policy "Allow all operations on products" on public.products for all using (true);
  end if;
end $$;

-- ================================================
-- MODIFIER GROUPS
-- ================================================
create table if not exists public.modifier_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  required boolean not null default false,
  min_selections int not null default 0,
  max_selections int not null default 1,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'modifier_groups' and policyname = 'Allow all operations on modifier_groups') then
    create policy "Allow all operations on modifier_groups" on public.modifier_groups for all using (true);
  end if;
end $$;

-- ================================================
-- MODIFIERS
-- ================================================
create table if not exists public.modifiers (
  id uuid primary key default uuid_generate_v4(),
  modifier_group_id uuid references public.modifier_groups(id) on delete cascade,
  name text not null,
  description text,
  price_delta numeric(10,2) not null default 0,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'modifiers' and policyname = 'Allow all operations on modifiers') then
    create policy "Allow all operations on modifiers" on public.modifiers for all using (true);
  end if;
end $$;

-- ================================================
-- MENUCARDS
-- ================================================
create table if not exists public.menucards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'menucards' and policyname = 'Allow all operations on menucards') then
    create policy "Allow all operations on menucards" on public.menucards for all using (true);
  end if;
end $$;

-- ================================================
-- PRODUCT-MODIFIER RELATIONSHIPS
-- ================================================
create table if not exists public.product_modifier_groups (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  modifier_group_id uuid references public.modifier_groups(id) on delete cascade,
  required boolean not null default false,
  sort_index int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, modifier_group_id)
);

-- Create policy only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'product_modifier_groups' and policyname = 'Allow all operations on product_modifier_groups') then
    create policy "Allow all operations on product_modifier_groups" on public.product_modifier_groups for all using (true);
  end if;
end $$;

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================
alter table public.tax_codes enable row level security;
alter table public.product_groups enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.menucards enable row level security;
alter table public.product_modifier_groups enable row level security;

-- ================================================
-- INSERT DEFAULT DATA
-- ================================================

-- Insert default tax code if none exists
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'tax_codes' and column_name = 'code') then
    -- New schema with code column
    insert into public.tax_codes (name, code, rate, description, active)
    select 'Standard Tax', 'STD', 0.25, 'Standard tax rate', true
    where not exists (select 1 from public.tax_codes);
    
    -- Update existing records to have a default code if they don't have one
    update public.tax_codes 
    set code = 'STD' 
    where code is null;
  else
    -- Old schema without code column
    insert into public.tax_codes (name, rate)
    select 'Standard Tax', 0.25
    where not exists (select 1 from public.tax_codes);
  end if;
end $$;

-- Insert default product group if none exists
insert into public.product_groups (name, description, active)
select 'General', 'General product group', true
where not exists (select 1 from public.product_groups);

-- Insert default menucard if none exists
insert into public.menucards (name, description, active)
select 'Main Menu', 'Main restaurant menu', true
where not exists (select 1 from public.menucards);

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
