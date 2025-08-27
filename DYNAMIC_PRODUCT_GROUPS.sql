-- ================================================
-- DYNAMIC PRODUCT GROUPS SYSTEM
-- ================================================
-- This ensures all accounts have default product groups and makes the system scalable

-- ================================================
-- STEP 1: ENSURE PRODUCT GROUPS TABLE EXISTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- ================================================
-- STEP 2: CREATE DEFAULT PRODUCT GROUPS
-- ================================================
-- Insert default product groups if they don't exist
DO $$
BEGIN
    -- Insert Food group if it doesn't exist
    INSERT INTO product_groups (name, description, sort_order, color)
    VALUES ('Food', 'Main food items and dishes', 1, '#EF4444')
    ON CONFLICT (company_id, name) DO NOTHING;
    
    -- Insert Drinks group if it doesn't exist  
    INSERT INTO product_groups (name, description, sort_order, color)
    VALUES ('Drinks', 'Beverages and liquid refreshments', 2, '#3B82F6')
    ON CONFLICT (company_id, name) DO NOTHING;
    
    RAISE NOTICE '✅ Default product groups (Food, Drinks) ensured for all accounts.';
END $$;

-- ================================================
-- STEP 3: CREATE INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_product_groups_company 
ON public.product_groups(company_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_product_groups_name 
ON public.product_groups(company_id, name);

-- ================================================
-- STEP 4: ENSURE PRODUCTS HAVE PRODUCT GROUP ASSIGNMENTS
-- ================================================
-- This table links products to product groups (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.product_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_group_id UUID NOT NULL REFERENCES public.product_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, product_group_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_group_assignments_product 
ON public.product_group_assignments(product_id);

CREATE INDEX IF NOT EXISTS idx_product_group_assignments_group 
ON public.product_group_assignments(product_group_id);

-- ================================================
-- STEP 5: ASSIGN DEFAULT PRODUCT GROUP TO EXISTING PRODUCTS
-- ================================================
-- Assign all products without product groups to the "Food" group by default
DO $$
DECLARE
    food_group_id UUID;
    product_rec RECORD;
BEGIN
    -- Get the Food group ID
    SELECT id INTO food_group_id 
    FROM product_groups 
    WHERE name = 'Food' 
    LIMIT 1;
    
    -- Assign Food group to products without any product group
    FOR product_rec IN 
        SELECT p.id as product_id
        FROM products p
        LEFT JOIN product_group_assignments pga ON pga.product_id = p.id
        WHERE pga.id IS NULL
    LOOP
        INSERT INTO product_group_assignments (product_id, product_group_id, is_primary)
        VALUES (product_rec.product_id, food_group_id, true);
    END LOOP;
    
    RAISE NOTICE '✅ Assigned default product groups to products without assignments.';
END $$;

-- ================================================
-- STEP 6: VERIFICATION QUERIES
-- ================================================
-- Run these to verify everything is working:

-- Check default product groups exist
-- SELECT name, description, sort_order, color FROM product_groups ORDER BY sort_order;

-- Check products have product group assignments
-- SELECT 
--     p.name as product_name,
--     pg.name as product_group_name,
--     pga.is_primary
-- FROM products p
-- JOIN product_group_assignments pga ON pga.product_id = p.id
-- JOIN product_groups pg ON pg.id = pga.product_group_id
-- ORDER BY p.name;

RAISE NOTICE '🎯 Dynamic Product Groups system is ready!';
RAISE NOTICE '📝 All accounts now have default Food and Drinks groups.';
RAISE NOTICE '🔧 Product groups can now be created dynamically from the UI.';
