-- ================================================
-- UNIFIED MENU SYSTEM MIGRATION
-- ================================================
-- This script sets up the complete unified menu system
-- Run this after backing up your existing data

-- ================================================
-- 1. CREATE BASE TABLES (if they don't exist)
-- ================================================

-- Tax codes table
CREATE TABLE IF NOT EXISTS tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product groups table
CREATE TABLE IF NOT EXISTS product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  product_group_id UUID REFERENCES product_groups(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modifier groups table
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'single', -- 'single', 'multiple'
  description TEXT,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modifiers table
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product-modifier group associations
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, modifier_group_id)
);

-- Menucards table
CREATE TABLE IF NOT EXISTS menucards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menucard-category associations
CREATE TABLE IF NOT EXISTS menucard_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menucard_id UUID NOT NULL REFERENCES menucards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menucard_id, category_id)
);

-- Menucard-product associations
CREATE TABLE IF NOT EXISTS menucard_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menucard_id UUID NOT NULL REFERENCES menucards(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menucard_id, product_id)
);

-- Product prices table
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  context VARCHAR(50) NOT NULL, -- 'dine_in', 'takeaway', 'delivery'
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_code_id UUID REFERENCES tax_codes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, context)
);

-- ================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_index ON categories(sort_index);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_group_id ON products(product_group_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_sort_index ON products(sort_index);

-- Modifiers
CREATE INDEX IF NOT EXISTS idx_modifiers_modifier_group_id ON modifiers(modifier_group_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_active ON modifiers(active);
CREATE INDEX IF NOT EXISTS idx_modifiers_sort_index ON modifiers(sort_index);

-- Product-modifier associations
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product_id ON product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_modifier_group_id ON product_modifier_groups(modifier_group_id);

-- Menucard associations
CREATE INDEX IF NOT EXISTS idx_menucard_categories_menucard_id ON menucard_categories(menucard_id);
CREATE INDEX IF NOT EXISTS idx_menucard_categories_category_id ON menucard_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_menucard_products_menucard_id ON menucard_products(menucard_id);
CREATE INDEX IF NOT EXISTS idx_menucard_products_product_id ON menucard_products(product_id);

-- Product prices
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_context ON product_prices(context);

-- ================================================
-- 3. INSERT DEFAULT DATA
-- ================================================

-- Default tax codes
INSERT INTO tax_codes (id, name, rate, description) VALUES
  (gen_random_uuid(), 'No Tax', 0.0000, 'No tax applied'),
  (gen_random_uuid(), 'Standard VAT', 0.2500, 'Standard 25% VAT rate'),
  (gen_random_uuid(), 'Reduced VAT', 0.1200, 'Reduced 12% VAT rate'),
  (gen_random_uuid(), 'Zero VAT', 0.0000, 'Zero-rated items')
ON CONFLICT (name) DO NOTHING;

-- Default product groups
INSERT INTO product_groups (id, name, color, description) VALUES
  (gen_random_uuid(), 'Main Course', '#EF4444', 'Main course dishes'),
  (gen_random_uuid(), 'Appetizer', '#F59E0B', 'Starters and appetizers'),
  (gen_random_uuid(), 'Dessert', '#EC4899', 'Desserts and sweets'),
  (gen_random_uuid(), 'Beverage', '#3B82F6', 'Drinks and beverages'),
  (gen_random_uuid(), 'Side Dish', '#10B981', 'Side dishes and accompaniments')
ON CONFLICT (name) DO NOTHING;

-- Default menucard
INSERT INTO menucards (id, name, description, sort_index) VALUES
  (gen_random_uuid(), 'Main Menu', 'Default main menu', 1)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_tax_codes_updated_at BEFORE UPDATE ON tax_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_groups_updated_at BEFORE UPDATE ON product_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modifier_groups_updated_at BEFORE UPDATE ON modifier_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modifiers_updated_at BEFORE UPDATE ON modifiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menucards_updated_at BEFORE UPDATE ON menucards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON product_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. CREATE VIEWS FOR COMMON QUERIES
-- ================================================

-- View for complete menu structure
CREATE OR REPLACE VIEW menu_structure AS
SELECT 
  m.id as menucard_id,
  m.name as menucard_name,
  m.description as menucard_description,
  mc.sort_index as category_sort,
  c.id as category_id,
  c.name as category_name,
  c.description as category_description,
  c.parent_id as category_parent_id,
  pc.name as parent_category_name,
  p.id as product_id,
  p.name as product_name,
  p.description as product_description,
  p.sort_index as product_sort,
  pg.name as product_group_name,
  pg.color as product_group_color,
  pp.context as price_context,
  pp.price as price,
  tc.name as tax_code_name,
  tc.rate as tax_rate
FROM menucards m
LEFT JOIN menucard_categories mc ON m.id = mc.menucard_id
LEFT JOIN categories c ON mc.category_id = c.id
LEFT JOIN categories pc ON c.parent_id = pc.id
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN product_groups pg ON p.product_group_id = pg.id
LEFT JOIN product_prices pp ON p.id = pp.product_id
LEFT JOIN tax_codes tc ON pp.tax_code_id = tc.id
WHERE m.active = true AND c.active = true AND p.active = true
ORDER BY m.sort_index, mc.sort_index, c.sort_index, p.sort_index;

-- View for product modifiers
CREATE OR REPLACE VIEW product_modifiers_view AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  pmg.sort_index as modifier_sort,
  pmg.is_required,
  mg.id as modifier_group_id,
  mg.name as modifier_group_name,
  mg.type as modifier_group_type,
  mg.min_select,
  mg.max_select,
  m.id as modifier_id,
  m.name as modifier_name,
  m.price as modifier_price,
  m.sort_index as modifier_item_sort
FROM products p
LEFT JOIN product_modifier_groups pmg ON p.id = pmg.product_id
LEFT JOIN modifier_groups mg ON pmg.modifier_group_id = mg.id
LEFT JOIN modifiers m ON mg.id = m.modifier_group_id
WHERE p.active = true AND mg.active = true AND m.active = true
ORDER BY p.sort_index, pmg.sort_index, m.sort_index;

-- ================================================
-- 6. CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ================================================

-- Function to get category hierarchy
CREATE OR REPLACE FUNCTION get_category_hierarchy(category_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  description TEXT,
  parent_id UUID,
  level INTEGER,
  path TEXT,
  sort_index INTEGER,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    SELECT 
      c.id, c.name, c.description, c.parent_id, c.sort_index, c.active,
      0 as level,
      c.name::text as path
    FROM categories c
    WHERE (category_id IS NULL AND c.parent_id IS NULL) OR c.id = category_id
    
    UNION ALL
    
    SELECT 
      c.id, c.name, c.description, c.parent_id, c.sort_index, c.active,
      ct.level + 1,
      ct.path || ' > ' || c.name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.active = true
  )
  SELECT * FROM category_tree
  ORDER BY path, sort_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get products by category with pricing
CREATE OR REPLACE FUNCTION get_products_by_category(
  category_id UUID,
  include_inactive BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(200),
  description TEXT,
  category_id UUID,
  product_group_id UUID,
  sort_index INTEGER,
  active BOOLEAN,
  base_price DECIMAL(10,2),
  takeaway_price DECIMAL(10,2),
  has_modifiers BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.description, p.category_id, p.product_group_id, 
    p.sort_index, p.active,
    COALESCE(pp_dine.price, 0) as base_price,
    COALESCE(pp_take.price, 0) as takeaway_price,
    EXISTS(SELECT 1 FROM product_modifier_groups pmg WHERE pmg.product_id = p.id) as has_modifiers
  FROM products p
  LEFT JOIN product_prices pp_dine ON p.id = pp_dine.product_id AND pp_dine.context = 'dine_in'
  LEFT JOIN product_prices pp_take ON p.id = pp_take.product_id AND pp_take.context = 'takeaway'
  WHERE p.category_id = get_products_by_category.category_id
    AND (include_inactive OR p.active = true)
  ORDER BY p.sort_index, p.name;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. GRANT PERMISSIONS (adjust as needed)
-- ================================================

-- Grant permissions to authenticated users (adjust based on your auth setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================
-- 8. VERIFICATION QUERIES
-- ================================================

-- Check table creation
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN (
  'tax_codes', 'product_groups', 'categories', 'products', 
  'modifier_groups', 'modifiers', 'product_modifier_groups',
  'menucards', 'menucard_categories', 'menucard_products', 'product_prices'
)
ORDER BY tablename;

-- Check default data
SELECT 'tax_codes' as table_name, COUNT(*) as count FROM tax_codes
UNION ALL
SELECT 'product_groups', COUNT(*) FROM product_groups
UNION ALL
SELECT 'menucards', COUNT(*) FROM menucards;

-- Check views
SELECT schemaname, viewname FROM pg_views WHERE viewname IN ('menu_structure', 'product_modifiers_view');

-- Check functions
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('get_category_hierarchy', 'get_products_by_category');

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Your unified menu system is now ready!
-- 
-- Next steps:
-- 1. Test the API endpoints
-- 2. Migrate existing data if needed
-- 3. Update your frontend components to use the new unified hooks
-- 4. Remove old repository files once migration is complete
