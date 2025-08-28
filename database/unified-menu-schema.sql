-- ================================================
-- UNIFIED MENU SYSTEM SCHEMA MIGRATION
-- Establishes proper foreign key relationships and data integrity
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENSURE CORE TABLES EXIST WITH PROPER STRUCTURE
-- ================================================

-- TAX CODES
CREATE TABLE IF NOT EXISTS public.tax_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate NUMERIC(6,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- PRODUCT GROUPS
CREATE TABLE IF NOT EXISTS public.product_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- CATEGORIES (with hierarchy support)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  print_sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  product_group_id UUID REFERENCES public.product_groups(id) ON DELETE SET NULL,
  description TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTEXTUAL PRICING
CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  context TEXT NOT NULL CHECK (context IN ('dine_in','takeaway')),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_code_id UUID REFERENCES public.tax_codes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, context)
);

-- MENUCARDS
CREATE TABLE IF NOT EXISTS public.menucards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- MENUCARD CATEGORIES RELATIONSHIP
CREATE TABLE IF NOT EXISTS public.menucard_categories (
  menucard_id UUID NOT NULL REFERENCES public.menucards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (menucard_id, category_id)
);

-- MODIFIER GROUPS
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODIFIERS
CREATE TABLE IF NOT EXISTS public.modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('add','remove')) DEFAULT 'add',
  price_delta NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT MODIFIER GROUPS
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, modifier_group_id)
);

-- ================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ================================================

-- Add missing columns to categories if they don't exist
DO $$
BEGIN
  -- Add parent_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
    ALTER TABLE public.categories ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
  
  -- Add description if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
    ALTER TABLE public.categories ADD COLUMN description TEXT;
  END IF;
  
  -- Add active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'active') THEN
    ALTER TABLE public.categories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  
  -- Add print_sort_index if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'print_sort_index') THEN
    ALTER TABLE public.categories ADD COLUMN print_sort_index INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to products if they don't exist
DO $$
BEGIN
  -- Add product_group_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_group_id') THEN
    ALTER TABLE public.products ADD COLUMN product_group_id UUID REFERENCES public.product_groups(id) ON DELETE SET NULL;
  END IF;
  
  -- Add description if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
    ALTER TABLE public.products ADD COLUMN description TEXT;
  END IF;
  
  -- Add sort_index if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sort_index') THEN
    ALTER TABLE public.products ADD COLUMN sort_index INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Add active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active') THEN
    ALTER TABLE public.products ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(active, sort_index);
CREATE INDEX IF NOT EXISTS idx_categories_print_sort ON public.categories(print_sort_index);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_group_id ON public.products(product_group_id);
CREATE INDEX IF NOT EXISTS idx_products_active_sort ON public.products(active, sort_index);

-- Product prices indexes
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON public.product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_context ON public.product_prices(context);

-- Menucard indexes
CREATE INDEX IF NOT EXISTS idx_menucards_active_sort ON public.menucards(active, sort_index);

-- Menucard categories indexes
CREATE INDEX IF NOT EXISTS idx_menucard_categories_menucard ON public.menucard_categories(menucard_id);
CREATE INDEX IF NOT EXISTS idx_menucard_categories_category ON public.menucard_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_menucard_categories_sort ON public.menucard_categories(sort_index);

-- Modifier indexes
CREATE INDEX IF NOT EXISTS idx_modifiers_group_id ON public.modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_active_sort ON public.modifiers(active, sort_index);

-- Product modifier groups indexes
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_group ON public.product_modifier_groups(modifier_group_id);

-- ================================================
-- CREATE DEFAULT MENU CARD IF NONE EXISTS
-- ================================================

INSERT INTO public.menucards (id, name, description, sort_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Main Menu',
  'Default main menu for the restaurant',
  0,
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- ================================================
-- CREATE DEFAULT TAX CODE IF NONE EXISTS
-- ================================================

INSERT INTO public.tax_codes (id, name, rate)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Standard VAT',
  25.0
) ON CONFLICT (name) DO NOTHING;

-- ================================================
-- CREATE DEFAULT PRODUCT GROUP IF NONE EXISTS
-- ================================================

INSERT INTO public.product_groups (id, name, description, sort_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'General',
  'General product group',
  0,
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- ================================================
-- CREATE DEFAULT CATEGORY IF NONE EXISTS
-- ================================================

INSERT INTO public.categories (id, name, description, sort_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Main Dishes',
  'Main course dishes',
  0,
  TRUE
) ON CONFLICT DO NOTHING;

-- Link default category to default menucard
INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  0
) ON CONFLICT DO NOTHING;

-- ================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ================================================

-- View for complete menu data
CREATE OR REPLACE VIEW public.v_complete_menu AS
SELECT 
  m.id as menucard_id,
  m.name as menucard_name,
  m.description as menucard_description,
  mc.sort_index as category_sort,
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.parent_id as category_parent_id,
  c.sort_index as category_internal_sort,
  p.id as product_id,
  p.name as product_name,
  p.description as product_description,
  p.sort_index as product_sort,
  pp_dine.price as dine_in_price,
  pp_takeaway.price as takeaway_price,
  tc_dine.rate as dine_in_tax_rate,
  tc_takeaway.rate as takeaway_tax_rate
FROM public.menucards m
JOIN public.menucard_categories mc ON m.id = mc.menucard_id
JOIN public.categories c ON mc.category_id = c.id
LEFT JOIN public.products p ON c.id = p.category_id AND p.active = TRUE
LEFT JOIN public.product_prices pp_dine ON p.id = pp_dine.product_id AND pp_dine.context = 'dine_in'
LEFT JOIN public.product_prices pp_takeaway ON p.id = pp_takeaway.product_id AND pp_takeaway.context = 'takeaway'
LEFT JOIN public.tax_codes tc_dine ON pp_dine.tax_code_id = tc_dine.id
LEFT JOIN public.tax_codes tc_takeaway ON pp_takeaway.tax_code_id = tc_takeaway.id
WHERE m.active = TRUE AND c.active = TRUE
ORDER BY m.sort_index, mc.sort_index, c.sort_index, p.sort_index;

-- View for product modifiers
CREATE OR REPLACE VIEW public.v_product_modifiers AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  pmg.sort_index as group_sort,
  pmg.is_required,
  mg.id as modifier_group_id,
  mg.name as modifier_group_name,
  mg.min_select,
  mg.max_select,
  m.id as modifier_id,
  m.name as modifier_name,
  m.kind,
  m.price_delta,
  m.sort_index as modifier_sort
FROM public.products p
JOIN public.product_modifier_groups pmg ON p.id = pmg.product_id
JOIN public.modifier_groups mg ON pmg.modifier_group_id = mg.id
JOIN public.modifiers m ON mg.id = m.group_id
WHERE p.active = TRUE AND mg.active = TRUE AND m.active = TRUE
ORDER BY pmg.sort_index, m.sort_index;

-- ================================================
-- CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ================================================

-- Function to get complete menu for a specific menucard
CREATE OR REPLACE FUNCTION public.get_complete_menu(p_menucard_id UUID DEFAULT NULL)
RETURNS TABLE (
  menucard_id UUID,
  menucard_name TEXT,
  category_id UUID,
  category_name TEXT,
  category_parent_id UUID,
  product_id UUID,
  product_name TEXT,
  dine_in_price NUMERIC,
  takeaway_price NUMERIC,
  has_modifiers BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    c.id,
    c.name,
    c.parent_id,
    p.id,
    p.name,
    COALESCE(pp_dine.price, 0),
    COALESCE(pp_takeaway.price, 0),
    EXISTS(SELECT 1 FROM public.product_modifier_groups pmg WHERE pmg.product_id = p.id)
  FROM public.menucards m
  JOIN public.menucard_categories mc ON m.id = mc.menucard_id
  JOIN public.categories c ON mc.category_id = c.id
  LEFT JOIN public.products p ON c.id = p.category_id AND p.active = TRUE
  LEFT JOIN public.product_prices pp_dine ON p.id = pp_dine.product_id AND pp_dine.context = 'dine_in'
  LEFT JOIN public.product_prices pp_takeaway ON p.id = pp_takeaway.product_id AND pp_takeaway.context = 'takeaway'
  WHERE (p_menucard_id IS NULL OR m.id = p_menucard_id)
    AND m.active = TRUE 
    AND c.active = TRUE
  ORDER BY m.sort_index, mc.sort_index, c.sort_index, p.sort_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get category hierarchy
CREATE OR REPLACE FUNCTION public.get_category_hierarchy(p_parent_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  parent_id UUID,
  sort_index INTEGER,
  level INTEGER,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT 
      c.id, c.name, c.description, c.parent_id, c.sort_index,
      0 as level,
      c.name::TEXT as path
    FROM public.categories c
    WHERE (p_parent_id IS NULL AND c.parent_id IS NULL) OR c.parent_id = p_parent_id
    
    UNION ALL
    
    SELECT 
      c.id, c.name, c.description, c.parent_id, c.sort_index,
      ct.level + 1,
      ct.path || ' > ' || c.name
    FROM public.categories c
    JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.active = TRUE
  )
  SELECT * FROM category_tree
  ORDER BY level, sort_index;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant access to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL VIEWS IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tax_codes', 'product_groups', 'categories', 'products', 
    'product_prices', 'menucards', 'menucard_categories',
    'modifier_groups', 'modifiers', 'product_modifier_groups'
  );
