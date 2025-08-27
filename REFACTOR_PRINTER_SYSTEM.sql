-- ================================================
-- PRINTER SYSTEM REFACTOR: CATEGORIES → PRODUCT TYPES
-- ================================================
-- This migration simplifies the printer system by using product types
-- instead of complex category assignments and sort priorities

-- ================================================
-- STEP 1: CREATE NEW PRODUCT TYPE ASSIGNMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_product_type_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, product_type_id)
);

-- ================================================
-- STEP 2: MIGRATE EXISTING CATEGORY DATA TO PRODUCT TYPES
-- ================================================
-- This is a best-effort migration - you may need to adjust based on your data

-- Create a mapping function to convert categories to product types
DO $$
DECLARE
    category_rec RECORD;
    food_type_id UUID;
    drinks_type_id UUID;
    desserts_type_id UUID;
BEGIN
    -- Get product type IDs
    SELECT id INTO food_type_id FROM product_types WHERE code = 'food' LIMIT 1;
    SELECT id INTO drinks_type_id FROM product_types WHERE code = 'drinks' LIMIT 1;
    SELECT id INTO desserts_type_id FROM product_types WHERE code = 'desserts' LIMIT 1;
    
    -- If product types don't exist, create them
    IF food_type_id IS NULL THEN
        INSERT INTO product_types (name, code, sort_order, color) 
        VALUES ('Food', 'food', 1, '#EF4444') 
        RETURNING id INTO food_type_id;
    END IF;
    
    IF drinks_type_id IS NULL THEN
        INSERT INTO product_types (name, code, sort_order, color) 
        VALUES ('Drinks', 'drinks', 2, '#3B82F6') 
        RETURNING id INTO drinks_type_id;
    END IF;
    
    IF desserts_type_id IS NULL THEN
        INSERT INTO product_types (name, code, sort_order, color) 
        VALUES ('Desserts', 'desserts', 3, '#F59E0B') 
        RETURNING id INTO desserts_type_id;
    END IF;

    -- Migrate printer category assignments to product type assignments
    -- This is a simplified mapping - adjust based on your category names
    FOR category_rec IN 
        SELECT DISTINCT pca.printer_id, c.name as category_name
        FROM printer_category_assignments pca
        JOIN categories c ON c.id = pca.category_id
    LOOP
        -- Map categories to product types based on common patterns
        IF LOWER(category_rec.category_name) LIKE '%drink%' 
           OR LOWER(category_rec.category_name) LIKE '%beverage%'
           OR LOWER(category_rec.category_name) LIKE '%coffee%'
           OR LOWER(category_rec.category_name) LIKE '%tea%'
           OR LOWER(category_rec.category_name) LIKE '%juice%'
           OR LOWER(category_rec.category_name) LIKE '%soda%'
           OR LOWER(category_rec.category_name) LIKE '%beer%'
           OR LOWER(category_rec.category_name) LIKE '%wine%'
           OR LOWER(category_rec.category_name) LIKE '%cocktail%' THEN
            -- Assign to drinks
            INSERT INTO printer_product_type_assignments (printer_id, product_type_id)
            VALUES (category_rec.printer_id, drinks_type_id)
            ON CONFLICT (printer_id, product_type_id) DO NOTHING;
            
        ELSIF LOWER(category_rec.category_name) LIKE '%dessert%'
              OR LOWER(category_rec.category_name) LIKE '%sweet%'
              OR LOWER(category_rec.category_name) LIKE '%cake%'
              OR LOWER(category_rec.category_name) LIKE '%ice%cream%' THEN
            -- Assign to desserts
            INSERT INTO printer_product_type_assignments (printer_id, product_type_id)
            VALUES (category_rec.printer_id, desserts_type_id)
            ON CONFLICT (printer_id, product_type_id) DO NOTHING;
            
        ELSE
            -- Default to food for everything else
            INSERT INTO printer_product_type_assignments (printer_id, product_type_id)
            VALUES (category_rec.printer_id, food_type_id)
            ON CONFLICT (printer_id, product_type_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Converted category assignments to product type assignments.';
END $$;

-- ================================================
-- STEP 3: ENSURE ALL PRODUCTS HAVE PRODUCT TYPES
-- ================================================
-- Assign default product type to products that don't have one
DO $$
DECLARE
    food_type_id UUID;
    product_rec RECORD;
BEGIN
    -- Get food type ID
    SELECT id INTO food_type_id FROM product_types WHERE code = 'food' LIMIT 1;
    
    -- Assign food type to products without any product type
    FOR product_rec IN 
        SELECT p.id as product_id
        FROM products p
        LEFT JOIN product_type_assignments pta ON pta.product_id = p.id
        WHERE pta.id IS NULL
    LOOP
        INSERT INTO product_type_assignments (product_id, product_type_id, is_primary)
        VALUES (product_rec.product_id, food_type_id, true);
    END LOOP;
    
    RAISE NOTICE 'Assigned default product types to products without assignments.';
END $$;

-- ================================================
-- STEP 4: CREATE INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_printer_product_type_assignments_printer 
ON public.printer_product_type_assignments(printer_id);

CREATE INDEX IF NOT EXISTS idx_printer_product_type_assignments_type 
ON public.printer_product_type_assignments(product_type_id);

-- ================================================
-- STEP 5: DROP OLD TABLES (OPTIONAL - UNCOMMENT WHEN READY)
-- ================================================
-- WARNING: Only run these after confirming the migration worked correctly!

-- DROP TABLE IF EXISTS public.printer_category_assignments;
-- DROP TABLE IF EXISTS public.printer_product_group_assignments;  
-- DROP TABLE IF EXISTS public.printer_category_sort_priorities;

-- ================================================
-- STEP 6: VERIFICATION QUERIES
-- ================================================
-- Run these to verify the migration worked:

-- Check product type assignments per printer
-- SELECT 
--     pp.name as printer_name,
--     pt.name as product_type_name,
--     pt.code as product_type_code
-- FROM printer_profiles pp
-- JOIN printer_product_type_assignments ppta ON ppta.printer_id = pp.id
-- JOIN product_types pt ON pt.id = ppta.product_type_id
-- ORDER BY pp.name, pt.sort_order;

-- Check products without product types (should be empty)
-- SELECT p.name as product_name
-- FROM products p
-- LEFT JOIN product_type_assignments pta ON pta.product_id = p.id
-- WHERE pta.id IS NULL;

RAISE NOTICE '✅ Printer system refactor migration completed!';
RAISE NOTICE '🔧 Please verify the results with the verification queries above.';
RAISE NOTICE '⚠️  Uncomment the DROP TABLE statements when you are satisfied with the migration.';
