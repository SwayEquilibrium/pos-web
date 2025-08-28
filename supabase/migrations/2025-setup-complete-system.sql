-- ================================================
-- COMPLETE SYSTEM MIGRATION (SAFE VERSION)
-- Creates the entire POS system database structure
-- Handles existing tables and policies gracefully
-- 
-- This migration will:
-- 1. Create all missing tables (menu + orders + payments + tables)
-- 2. Add missing columns to existing tables
-- 3. Create policies only if they don't exist
-- 4. Handle both old and new schema versions
-- 5. Populate default data safely
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================
-- TABLES & ROOMS
-- ================================================

-- Create rooms table
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'rooms' and table_schema = 'public') then
    create table public.rooms (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      description text,
      active boolean not null default true,
      sort_index int not null default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(name)
    );
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'description') then
      alter table public.rooms add column description text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'active') then
      alter table public.rooms add column active boolean not null default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'sort_index') then
      alter table public.rooms add column sort_index int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'created_at') then
      alter table public.rooms add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'updated_at') then
      alter table public.rooms add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- Create tables table
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'tables' and table_schema = 'public') then
    create table public.tables (
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
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'room_id') then
      alter table public.tables add column room_id uuid references public.rooms(id) on delete set null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'capacity') then
      alter table public.tables add column capacity int not null default 4;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'status') then
      alter table public.tables add column status text not null default 'available';
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'position_x') then
      alter table public.tables add column position_x int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'position_y') then
      alter table public.tables add column position_y int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'width') then
      alter table public.tables add column width int not null default 100;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'height') then
      alter table public.tables add column height int not null default 100;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'active') then
      alter table public.tables add column active boolean not null default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'sort_index') then
      alter table public.tables add column sort_index int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'created_at') then
      alter table public.tables add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'tables' and column_name = 'updated_at') then
      alter table public.tables add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- ================================================
-- ORDERS SYSTEM
-- ================================================

-- Create orders table
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  type text not null default 'dine_in' check (type in ('dine_in', 'takeaway', 'delivery')),
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create order_items table
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

-- Create order_item_modifiers table
create table if not exists public.order_item_modifiers (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  modifier_name text not null,
  price_delta numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ================================================
-- PAYMENTS SYSTEM
-- ================================================

-- Create payment_types table
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'payment_types' and table_schema = 'public') then
    create table public.payment_types (
      id uuid primary key default uuid_generate_v4(),
      code text not null unique,
      name text not null,
      description text,
      active boolean not null default true,
      sort_index int not null default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'payment_types' and column_name = 'description') then
      alter table public.payment_types add column description text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'payment_types' and column_name = 'active') then
      alter table public.payment_types add column active boolean not null default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'payment_types' and column_name = 'sort_index') then
      alter table public.payment_types add column sort_index int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'payment_types' and column_name = 'created_at') then
      alter table public.payment_types add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'payment_types' and column_name = 'updated_at') then
      alter table public.payment_types add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- Create payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  payment_type_id uuid references public.payment_types(id) on delete set null,
  amount numeric(12,2) not null,
  reference text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  gateway_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ================================================
-- MENU SYSTEM (from previous migration)
-- ================================================

-- TAX CODES
do $$
begin
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

-- PRODUCT GROUPS
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

-- CATEGORIES
do $$
begin
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

-- PRODUCTS
do $$
begin
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
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'allergens') then
      alter table public.products add column allergens text[];
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'nutritional_info') then
      alter table public.products add column nutritional_info jsonb;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'created_at') then
      alter table public.products add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'updated_at') then
      alter table public.products add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- MODIFIER GROUPS
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

-- MODIFIERS
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

-- MENUCARDS
create table if not exists public.menucards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRODUCT-MODIFIER RELATIONSHIPS
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

-- ================================================
-- POLICIES
-- ================================================

-- Create policies only if they don't exist
do $$
begin
  -- Tax codes
  if not exists (select 1 from pg_policies where tablename = 'tax_codes' and policyname = 'Allow all operations on tax_codes') then
    create policy "Allow all operations on tax_codes" on public.tax_codes for all using (true);
  end if;
  
  -- Product groups
  if not exists (select 1 from pg_policies where tablename = 'product_groups' and policyname = 'Allow all operations on product_groups') then
    create policy "Allow all operations on product_groups" on public.product_groups for all using (true);
  end if;
  
  -- Categories
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'Allow all operations on categories') then
    create policy "Allow all operations on categories" on public.categories for all using (true);
  end if;
  
  -- Products
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'Allow all operations on products') then
    create policy "Allow all operations on products" on public.products for all using (true);
  end if;
  
  -- Modifier groups
  if not exists (select 1 from pg_policies where tablename = 'modifier_groups' and policyname = 'Allow all operations on modifier_groups') then
    create policy "Allow all operations on modifier_groups" on public.modifier_groups for all using (true);
  end if;
  
  -- Modifiers
  if not exists (select 1 from pg_policies where tablename = 'modifiers' and policyname = 'Allow all operations on modifiers') then
    create policy "Allow all operations on modifiers" on public.modifier_groups for all using (true);
  end if;
  
  -- Menucards
  if not exists (select 1 from pg_policies where tablename = 'menucards' and policyname = 'Allow all operations on menucards') then
    create policy "Allow all operations on menucards" on public.menucards for all using (true);
  end if;
  
  -- Product modifier groups
  if not exists (select 1 from pg_policies where tablename = 'product_modifier_groups' and policyname = 'Allow all operations on product_modifier_groups') then
    create policy "Allow all operations on product_modifier_groups" on public.product_modifier_groups for all using (true);
  end if;
  
  -- Rooms
  if not exists (select 1 from pg_policies where tablename = 'rooms' and policyname = 'Allow all operations on rooms') then
    create policy "Allow all operations on rooms" on public.rooms for all using (true);
  end if;
  
  -- Tables
  if not exists (select 1 from pg_policies where tablename = 'tables' and policyname = 'Allow all operations on tables') then
    create policy "Allow all operations on tables" on public.tables for all using (true);
  end if;
  
  -- Orders
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'Allow all operations on orders') then
    create policy "Allow all operations on orders" on public.orders for all using (true);
  end if;
  
  -- Order items
  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'Allow all operations on order_items') then
    create policy "Allow all operations on order_items" on public.order_items for all using (true);
  end if;
  
  -- Order item modifiers
  if not exists (select 1 from pg_policies where tablename = 'order_item_modifiers' and policyname = 'Allow all operations on order_item_modifiers') then
    create policy "Allow all operations on order_item_modifiers" on public.order_item_modifiers for all using (true);
  end if;
  
  -- Payment types
  if not exists (select 1 from pg_policies where tablename = 'payment_types' and policyname = 'Allow all operations on payment_types') then
    create policy "Allow all operations on payment_types" on public.payment_types for all using (true);
  end if;
  
  -- Payments
  if not exists (select 1 from pg_policies where tablename = 'payments' and policyname = 'Allow all operations on payments') then
    create policy "Allow all operations on payments" on public.payments for all using (true);
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
alter table public.rooms enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.payment_types enable row level security;
alter table public.payments enable row level security;

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

-- Insert default room if none exists
insert into public.rooms (name, description, active)
select 'Main Dining', 'Main dining area', true
where not exists (select 1 from public.rooms);

-- Insert default table if none exists
insert into public.tables (name, room_id, capacity, status, active)
select 'Table 1', (select id from public.rooms limit 1), 4, 'available', true
where not exists (select 1 from public.tables);

-- Insert default payment types
insert into public.payment_types (code, name, description, active, sort_index)
values 
  ('CASH', 'Cash', 'Cash payment', true, 1),
  ('CARD', 'Card', 'Credit/Debit card', true, 2),
  ('GIFT_CARD', 'Gift Card', 'Gift card payment', true, 3)
on conflict (code) do nothing;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
