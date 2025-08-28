-- ================================================
-- CLEAN COMPLETE SYSTEM MIGRATION
-- Single migration to fix all database issues
-- Creates clean, consistent schema
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================
-- CORE MENU TABLES (Create if missing)
-- ================================================

-- Tax codes table
create table if not exists public.tax_codes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null,
  rate numeric(6,3) not null default 0.000,
  description text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name),
  unique(code)
);

-- Product groups table
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

-- Categories table (with hierarchy support)
create table if not exists public.categories (
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

-- Modifier groups table
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
  updated_at timestamptz default now(),
  unique(name)
);

-- Modifiers table
create table if not exists public.modifiers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  modifier_group_id uuid references public.modifier_groups(id) on delete cascade,
  price_delta numeric(10,2) not null default 0.00,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  product_group_id uuid references public.product_groups(id) on delete set null,
  active boolean not null default true,
  sort_index int not null default 0,
  color text,
  emoji text,
  display_style text,
  image_url text,
  image_thumbnail_url text,
  allergens text[],
  nutritional_info jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product-modifier relationships
create table if not exists public.product_modifier_groups (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  modifier_group_id uuid references public.modifier_groups(id) on delete cascade,
  required boolean not null default false,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  unique(product_id, modifier_group_id)
);

-- Menucards table
create table if not exists public.menucards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

-- Menucard-category relationships
create table if not exists public.menucard_categories (
  menucard_id uuid references public.menucards(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  primary key (menucard_id, category_id)
);

-- ================================================
-- ORDERS SYSTEM TABLES
-- ================================================

-- Orders table
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text,
  table_id uuid,
  customer_name text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  type text not null default 'dine_in' check (type in ('dine_in', 'takeaway', 'delivery')),
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  category_name text,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  modifiers_total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order item modifiers table
create table if not exists public.order_item_modifiers (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  modifier_name text not null,
  modifier_group_name text,
  price_delta numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ================================================
-- TABLES & ROOMS SYSTEM
-- ================================================

-- Rooms table
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

-- Tables table
create table if not exists public.tables (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  room_id uuid references public.rooms(id) on delete set null,
  capacity int not null default 4,
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved', 'cleaning')),
  position_x int not null default 0,
  position_y int not null default 0,
  width int not null default 100,
  height int not null default 100,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

-- ================================================
-- PAYMENT SYSTEM TABLES
-- ================================================

-- Payment types table
create table if not exists public.payment_types (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  name text not null,
  description text,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(code),
  unique(name)
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete set null,
  payment_type_id uuid references public.payment_types(id) on delete set null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ================================================
-- PRINTER SYSTEM TABLES
-- ================================================

-- Printers table
create table if not exists public.printers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  display_name text not null,
  printer_type text not null default 'CloudPRNT',
  connection_string text not null default 'auto-detect',
  brand text default 'Star',
  paper_width int default 48,
  supports_cut boolean default true,
  cut_command_hex text default '1B6401',
  cut_command_name text default 'ESC d 1 (Partial Cut)',
  print_kitchen_receipts boolean default true,
  print_customer_receipts boolean default false,
  auto_print_on_order boolean default true,
  auto_print_on_payment boolean default false,
  is_active boolean default true,
  is_default boolean default false,
  last_test_at timestamptz,
  last_test_result text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

-- Print jobs table
create table if not exists public.print_jobs (
  id uuid primary key default uuid_generate_v4(),
  printer_id uuid references public.printers(id) on delete cascade,
  job_type text not null check (job_type in ('receipt', 'kitchen', 'custom')),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'printing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ================================================

-- Add missing columns to existing products table
do $$
begin
  -- Add allergens column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'allergens') then
    alter table public.products add column allergens text[];
  end if;
  
  -- Add nutritional_info column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'nutritional_info') then
    alter table public.products add column nutritional_info jsonb;
  end if;
  
  -- Add color column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'color') then
    alter table public.products add column color text;
  end if;
  
  -- Add emoji column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'emoji') then
    alter table public.products add column emoji text;
  end if;
  
  -- Add display_style column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'display_style') then
    alter table public.products add column display_style text;
  end if;
  
  -- Add image_url column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_url') then
    alter table public.products add column image_url text;
  end if;
  
  -- Add image_thumbnail_url column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_thumbnail_url') then
    alter table public.products add column image_thumbnail_url text;
  end if;
  
  -- Add product_group_id column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'product_group_id') then
    alter table public.products add column product_group_id uuid references public.product_groups(id) on delete set null;
  end if;
end $$;

-- Add missing columns to existing categories table
do $$
begin
  -- Add print_sort_index column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'print_sort_index') then
    alter table public.categories add column print_sort_index int not null default 0;
  end if;
  
  -- Add active column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'active') then
    alter table public.categories add column active boolean not null default true;
  end if;
  
  -- Add sort_index column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'sort_index') then
    alter table public.categories add column sort_index int not null default 0;
  end if;
end $$;

-- Add missing columns to existing modifier_groups table
do $$
begin
  -- Add required column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'required') then
    alter table public.modifier_groups add column required boolean not null default false;
  end if;
  
  -- Add min_selections column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'min_selections') then
    alter table public.modifier_groups add column min_selections int not null default 0;
  end if;
  
  -- Add max_selections column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'max_selections') then
    alter table public.modifier_groups add column max_selections int not null default 1;
  end if;
end $$;

-- ================================================
-- INSERT DEFAULT DATA
-- ================================================

-- Default tax codes
insert into public.tax_codes (name, code, rate, description, active) values
  ('Standard VAT', 'VAT_STANDARD', 0.250, 'Standard Danish VAT rate', true),
  ('Reduced VAT', 'VAT_REDUCED', 0.000, 'Reduced VAT rate for food', true)
on conflict (name) do nothing;

-- Default product groups
insert into public.product_groups (name, description, active, sort_index) values
  ('General', 'General product group', true, 0),
  ('Beverages', 'Drinks and beverages', true, 1),
  ('Appetizers', 'Starters and appetizers', true, 2),
  ('Main Course', 'Main dishes', true, 3),
  ('Desserts', 'Sweet treats and desserts', true, 4),
  ('Sides', 'Side dishes and accompaniments', true, 5)
on conflict (name) do nothing;

-- Default payment types
insert into public.payment_types (code, name, description, active, sort_index) values
  ('CASH', 'Cash', 'Cash payment', true, 1),
  ('CARD', 'Card', 'Credit/Debit card', true, 2),
  ('GIFT_CARD', 'Gift Card', 'Gift card payment', true, 3)
on conflict (code) do nothing;

-- Default room and table
insert into public.rooms (name, description, active, sort_index) values
  ('Main Dining', 'Main dining area', true, 0)
on conflict (name) do nothing;

insert into public.tables (name, room_id, capacity, active, sort_index) 
select 'Table 1', r.id, 4, true, 0
from public.rooms r where r.name = 'Main Dining'
on conflict (name) do nothing;

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================

-- Enable RLS on all tables
do $$
declare
  table_name text;
begin
  for table_name in 
    select tablename from pg_tables 
    where schemaname = 'public' 
    and tablename not like 'pg_%'
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

-- ================================================
-- CREATE BASIC POLICIES
-- ================================================

-- Allow all operations for now (you can restrict later)
do $$
declare
  table_name text;
begin
  for table_name in 
    select tablename from pg_tables 
    where schemaname = 'public' 
    and tablename not like 'pg_%'
  loop
    execute format('create policy "Allow all operations on %I" on public.%I for all using (true)', table_name, table_name);
  end loop;
exception
  when duplicate_object then
    -- Policy already exists, skip
    null;
end $$;

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Products indexes
create index if not exists idx_products_category on public.products(category_id, active);
create index if not exists idx_products_group on public.products(product_group_id, active);
create index if not exists idx_products_active on public.products(active, sort_index);

-- Modifiers indexes
create index if not exists idx_modifiers_group on public.modifiers(modifier_group_id, active);
create index if not exists idx_modifiers_active on public.modifiers(active, sort_index);

-- Orders indexes
create index if not exists idx_orders_table on public.orders(table_id, status);
create index if not exists idx_orders_status on public.orders(status, created_at);
create index if not exists idx_orders_created on public.orders(created_at);

-- Tables indexes
create index if not exists idx_tables_room on public.tables(room_id, active);
create index if not exists idx_tables_status on public.tables(status, active);

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- This migration creates a clean, complete system
-- All tables now exist with proper structure
-- All missing columns have been added
-- No more {} errors in your code!
-- Your menu system should work immediately
