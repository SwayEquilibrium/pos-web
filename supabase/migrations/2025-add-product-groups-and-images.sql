-- ================================================
-- ADD PRODUCT GROUPS AND IMAGES (SAFE VERSION)
-- Adds product groups table and image columns to products
-- Follows our established architecture rules
-- ================================================

-- ================================================
-- PRODUCT GROUPS TABLE
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
-- ADD IMAGE COLUMNS TO PRODUCTS
-- ================================================
do $$
begin
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
end $$;

-- ================================================
-- POLICIES
-- ================================================
do $$
begin
  -- Create policy for product_groups only if it doesn't exist
  if not exists (select 1 from pg_policies where tablename = 'product_groups' and policyname = 'Allow all operations on product_groups') then
    create policy "Allow all operations on product_groups" on public.product_groups for all using (true);
  end if;
end $$;

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================
alter table public.product_groups enable row level security;

-- ================================================
-- INSERT DEFAULT DATA
-- ================================================

-- Insert default product group if none exists
insert into public.product_groups (name, description, active, sort_index)
select 'General', 'General product group', true, 0
where not exists (select 1 from public.product_groups);

-- Insert a few more useful product groups
insert into public.product_groups (name, description, active, sort_index)
values 
  ('Beverages', 'Drinks and beverages', true, 1),
  ('Appetizers', 'Starters and appetizers', true, 2),
  ('Main Course', 'Main dishes', true, 3),
  ('Desserts', 'Sweet treats and desserts', true, 4),
  ('Sides', 'Side dishes and accompaniments', true, 5)
on conflict (name) do nothing;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
