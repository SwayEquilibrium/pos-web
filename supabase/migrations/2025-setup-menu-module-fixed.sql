-- ================================================
-- MENU MODULE MIGRATION (FIXED VERSION)
-- Creates scalable menu management system
-- Handles existing columns properly
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================
-- TAX CODES
-- ================================================
create table if not exists public.tax_codes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rate numeric(6,3) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(name)
);

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
  
  -- Add missing columns for existing categories table
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
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  else
    -- Add missing columns if they don't exist
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'product_group_id') then
      alter table public.products add column product_group_id uuid references public.product_groups(id) on delete set null;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'description') then
      alter table public.products add column description text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'active') then
      alter table public.products add column active boolean not null default true;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'created_at') then
      alter table public.products add column created_at timestamptz default now();
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'updated_at') then
      alter table public.products add column updated_at timestamptz default now();
    end if;
  end if;
end $$;

-- ================================================
-- CONTEXTUAL PRICING
-- ================================================
create table if not exists public.product_prices (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  context text not null check (context in ('dine_in','takeaway')),
  price numeric(12,2) not null default 0,
  tax_code_id uuid references public.tax_codes(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, context)
);

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
  updated_at timestamptz default now(),
  unique(name)
);

-- ================================================
-- MENUCARD CATEGORIES RELATIONSHIP
-- ================================================
create table if not exists public.menucard_categories (
  menucard_id uuid not null references public.menucards(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  sort_index int not null default 0,
  created_at timestamptz default now(),
  primary key (menucard_id, category_id)
);

-- ================================================
-- MODIFIERS (align with existing system - FIXED VERSION)
-- ================================================
do $$
begin
  -- Create modifier_groups if it doesn't exist or align existing
  if not exists (select 1 from information_schema.tables where table_name = 'modifier_groups' and table_schema = 'public') then
    create table public.modifier_groups (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      description text,
      min_select int not null default 0,
      max_select int not null default 0,
      sort_index int not null default 0,
      active boolean not null default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique(name)
    );
  else
    -- Add missing columns to existing modifier_groups
    if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'min_select') then
      alter table public.modifier_groups add column min_select int not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'max_select') then
      alter table public.modifier_groups add column max_select int not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'modifier_groups' and column_name = 'description') then
      alter table public.modifier_groups add column description text;
    end if;
  end if;
end $$;

-- ================================================
-- MODIFIERS TABLE (FIXED VERSION)
-- ================================================
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'modifiers' and table_schema = 'public') then
    create table public.modifiers (
      id uuid primary key default uuid_generate_v4(),
      group_id uuid not null references public.modifier_groups(id) on delete cascade,
      name text not null,
      description text,
      kind text not null check (kind in ('add','remove')) default 'add',
      price_delta numeric(12,2) not null default 0,
      sort_index int not null default 0,
      active boolean not null default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  else
    -- Handle existing modifiers table with proper column management
    
    -- Add kind column if it doesn't exist
    if not exists (select 1 from information_schema.columns where table_name = 'modifiers' and column_name = 'kind') then
      alter table public.modifiers add column kind text not null check (kind in ('add','remove')) default 'add';
    end if;
    
    -- Handle price_delta column properly
    if not exists (select 1 from information_schema.columns where table_name = 'modifiers' and column_name = 'price_delta') then
      -- price_delta doesn't exist, check if price_adjustment exists
      if exists (select 1 from information_schema.columns where table_name = 'modifiers' and column_name = 'price_adjustment') then
        -- Rename price_adjustment to price_delta
        alter table public.modifiers rename column price_adjustment to price_delta;
      else
        -- Neither exists, add price_delta
        alter table public.modifiers add column price_delta numeric(12,2) not null default 0;
      end if;
    else
      -- price_delta exists, check if price_adjustment also exists
      if exists (select 1 from information_schema.columns where table_name = 'modifiers' and column_name = 'price_adjustment') then
        -- Both exist, copy data from price_adjustment to price_delta if price_delta is empty/zero
        update public.modifiers set price_delta = price_adjustment where price_delta = 0 and price_adjustment != 0;
        -- Drop the old price_adjustment column
        alter table public.modifiers drop column price_adjustment;
      end if;
    end if;
    
    -- Add other missing columns
    if not exists (select 1 from information_schema.columns where table_name = 'modifiers' and column_name = 'description') then
      alter table public.modifiers add column description text;
    end if;
  end if;
end $$;

-- ================================================
-- PRODUCT MODIFIER GROUPS RELATIONSHIP (FIXED VERSION)
-- ================================================
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'product_modifier_groups' and table_schema = 'public') then
    create table public.product_modifier_groups (
      product_id uuid not null references public.products(id) on delete cascade,
      group_id uuid not null references public.modifier_groups(id) on delete cascade,
      sort_index int not null default 0,
      is_required boolean not null default false,
      created_at timestamptz default now(),
      primary key (product_id, group_id)
    );
  else
    -- Handle existing table with proper column management
    if exists (select 1 from information_schema.columns where table_name = 'product_modifier_groups' and column_name = 'modifier_group_id') 
       and not exists (select 1 from information_schema.columns where table_name = 'product_modifier_groups' and column_name = 'group_id') then
      -- Rename modifier_group_id to group_id
      alter table public.product_modifier_groups rename column modifier_group_id to group_id;
    end if;
    
    -- Add missing columns
    if not exists (select 1 from information_schema.columns where table_name = 'product_modifier_groups' and column_name = 'sort_index') then
      alter table public.product_modifier_groups add column sort_index int not null default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'product_modifier_groups' and column_name = 'created_at') then
      alter table public.product_modifier_groups add column created_at timestamptz default now();
    end if;
  end if;
end $$;

-- ================================================
-- VIEWS FOR EDITOR
-- ================================================
create or replace view public.v_menu_editor_products as
select
  p.id as product_id,
  p.name,
  p.description,
  p.category_id,
  p.product_group_id,
  p.active,
  c.name as category_name,
  pg.name as product_group_name,
  dip.price as dine_in_price,
  dip.tax_code_id as dine_in_tax,
  tip.price as takeaway_price,
  tip.tax_code_id as takeaway_tax,
  p.created_at,
  p.updated_at
from public.products p
left join public.categories c on c.id = p.category_id
left join public.product_groups pg on pg.id = p.product_group_id
left join public.product_prices dip on dip.product_id = p.id and dip.context = 'dine_in'
left join public.product_prices tip on tip.product_id = p.id and tip.context = 'takeaway'
where p.active = true;

-- ================================================
-- RPC FUNCTIONS
-- ================================================

-- Helper function to upsert product + prices atomically
create or replace function public.upsert_product_with_prices(
  p_product_id uuid,
  p_name text,
  p_category_id uuid,
  p_product_group_id uuid,
  p_description text,
  p_dine_in_price numeric,
  p_dine_in_tax uuid,
  p_takeaway_price numeric,
  p_takeaway_tax uuid
) returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  if p_product_id is null then
    v_id := uuid_generate_v4();
    insert into public.products(id, name, category_id, product_group_id, description)
    values (v_id, p_name, p_category_id, p_product_group_id, p_description);
  else
    v_id := p_product_id;
    update public.products
       set name = p_name,
           category_id = p_category_id,
           product_group_id = p_product_group_id,
           description = p_description,
           updated_at = now()
     where id = v_id;
  end if;

  -- dine_in price
  insert into public.product_prices(product_id, context, price, tax_code_id)
  values (v_id, 'dine_in', coalesce(p_dine_in_price,0), p_dine_in_tax)
  on conflict (product_id, context)
  do update set price = excluded.price, tax_code_id = excluded.tax_code_id, updated_at = now();

  -- takeaway price
  insert into public.product_prices(product_id, context, price, tax_code_id)
  values (v_id, 'takeaway', coalesce(p_takeaway_price,0), p_takeaway_tax)
  on conflict (product_id, context)
  do update set price = excluded.price, tax_code_id = excluded.tax_code_id, updated_at = now();

  return v_id;
end $$;

-- Reorder helper for categories / product groups / product_modifier_groups / menucard_categories
create or replace function public.reorder_entities(
  p_table text,           -- 'categories' | 'product_groups' | 'product_modifier_groups' | 'menucard_categories'
  p_parent_id uuid,       -- nullable for categories/product_groups; required for relations
  p_ids uuid[],           -- new order list
  p_sort_start int default 0
) returns void language plpgsql security definer as $$
declare i int := 0; v_id uuid; 
begin
  if p_table = 'categories' then
    foreach v_id in array p_ids loop
      update public.categories set sort_index = p_sort_start + i, updated_at = now() where id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'product_groups' then
    foreach v_id in array p_ids loop
      update public.product_groups set sort_index = p_sort_start + i, updated_at = now() where id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'product_modifier_groups' then
    -- parent is product_id
    foreach v_id in array p_ids loop
      update public.product_modifier_groups set sort_index = p_sort_start + i
      where product_id = p_parent_id and group_id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'menucard_categories' then
    -- parent is menucard_id
    foreach v_id in array p_ids loop
      update public.menucard_categories set sort_index = p_sort_start + i
      where menucard_id = p_parent_id and category_id = v_id;
      i := i + 1;
    end loop;
  else
    raise exception 'Unsupported table %', p_table;
  end if;
end $$;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
create index if not exists idx_categories_parent_sort on public.categories(parent_id, sort_index);
create index if not exists idx_categories_active on public.categories(active, sort_index);
create index if not exists idx_products_category on public.products(category_id, active);
create index if not exists idx_products_group on public.products(product_group_id, active);
create index if not exists idx_product_prices_context on public.product_prices(product_id, context);
create index if not exists idx_modifier_groups_active on public.modifier_groups(active, sort_index);
create index if not exists idx_modifiers_group on public.modifiers(group_id, active, sort_index);
create index if not exists idx_product_modifier_groups_product on public.product_modifier_groups(product_id, sort_index);
create index if not exists idx_menucard_categories_menucard on public.menucard_categories(menucard_id, sort_index);

-- ================================================
-- ROW LEVEL SECURITY (if needed)
-- ================================================
-- Enable RLS on new tables
alter table public.tax_codes enable row level security;
alter table public.product_groups enable row level security;
alter table public.product_prices enable row level security;
alter table public.menucards enable row level security;
alter table public.menucard_categories enable row level security;

-- Create permissive policies for authenticated users (adjust as needed)
create policy "Allow all operations on tax_codes" on public.tax_codes for all using (true);
create policy "Allow all operations on product_groups" on public.product_groups for all using (true);
create policy "Allow all operations on product_prices" on public.product_prices for all using (true);
create policy "Allow all operations on menucards" on public.menucards for all using (true);
create policy "Allow all operations on menucard_categories" on public.menucard_categories for all using (true);

-- ================================================
-- UPDATE TRIGGERS
-- ================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add update triggers to all tables
drop trigger if exists trg_tax_codes_updated on public.tax_codes;
create trigger trg_tax_codes_updated before update on public.tax_codes for each row execute function public.handle_updated_at();

drop trigger if exists trg_product_groups_updated on public.product_groups;
create trigger trg_product_groups_updated before update on public.product_groups for each row execute function public.handle_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories for each row execute function public.handle_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products for each row execute function public.handle_updated_at();

drop trigger if exists trg_product_prices_updated on public.product_prices;
create trigger trg_product_prices_updated before update on public.product_prices for each row execute function public.handle_updated_at();

drop trigger if exists trg_menucards_updated on public.menucards;
create trigger trg_menucards_updated before update on public.menucards for each row execute function public.handle_updated_at();

drop trigger if exists trg_modifier_groups_updated on public.modifier_groups;
create trigger trg_modifier_groups_updated before update on public.modifier_groups for each row execute function public.handle_updated_at();

drop trigger if exists trg_modifiers_updated on public.modifiers;
create trigger trg_modifiers_updated before update on public.modifiers for each row execute function public.handle_updated_at();
