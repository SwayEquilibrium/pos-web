-- ================================================
-- DEFAULT MENU CARD SYSTEM
-- ================================================
-- This ensures all accounts have a default menu card to start with

-- ================================================
-- STEP 1: ENSURE MENUCARDS TABLE EXISTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.menucards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- ================================================
-- STEP 2: CREATE DEFAULT MENU CARD
-- ================================================
-- Insert default menu card if none exists
DO $$
BEGIN
    -- Insert default menu card if no menu cards exist for this company
    IF NOT EXISTS (SELECT 1 FROM menucards WHERE company_id = '00000000-0000-0000-0000-000000000000') THEN
        INSERT INTO menucards (name, description, sort_index, is_active)
        VALUES ('Main Menu', 'Your main restaurant menu', 0, true);
        
        RAISE NOTICE '✅ Created default "Main Menu" card for account.';
    ELSE
        RAISE NOTICE 'ℹ️ Menu cards already exist for this account.';
    END IF;
END $$;

-- ================================================
-- STEP 3: CREATE INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_menucards_company 
ON public.menucards(company_id, is_active, sort_index);

-- ================================================
-- STEP 4: ENSURE CATEGORIES TABLE SUPPORTS HIERARCHY
-- ================================================
-- Make sure categories table supports parent-child relationships
DO $$
BEGIN
    -- Check if parent_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added parent_id column to categories for hierarchy support.';
    END IF;

    -- Check if menucard_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'menucard_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN menucard_id UUID REFERENCES menucards(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added menucard_id column to categories for menu card association.';
    END IF;
END $$;

-- ================================================
-- STEP 5: LINK EXISTING CATEGORIES TO DEFAULT MENU CARD
-- ================================================
-- Link any existing root categories to the default menu card
DO $$
DECLARE
    default_menu_id UUID;
BEGIN
    -- Get the default menu card ID
    SELECT id INTO default_menu_id 
    FROM menucards 
    WHERE name = 'Main Menu' 
    AND company_id = '00000000-0000-0000-0000-000000000000'
    LIMIT 1;
    
    -- Update categories without menucard_id to link to default menu
    IF default_menu_id IS NOT NULL THEN
        UPDATE categories 
        SET menucard_id = default_menu_id 
        WHERE menucard_id IS NULL 
        AND company_id = '00000000-0000-0000-0000-000000000000';
        
        RAISE NOTICE '✅ Linked existing categories to default menu card.';
    END IF;
END $$;

-- ================================================
-- STEP 6: CREATE DEFAULT CATEGORIES FOR EMPTY MENU CARDS
-- ================================================
-- Create some basic categories for the default menu card if none exist
DO $$
DECLARE
    default_menu_id UUID;
BEGIN
    -- Get the default menu card ID
    SELECT id INTO default_menu_id 
    FROM menucards 
    WHERE name = 'Main Menu' 
    AND company_id = '00000000-0000-0000-0000-000000000000'
    LIMIT 1;
    
    -- Create basic categories if none exist for this menu card
    IF default_menu_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM categories WHERE menucard_id = default_menu_id
    ) THEN
        INSERT INTO categories (name, description, menucard_id, parent_id, sort_order, active)
        VALUES 
        ('Starters', 'Appetizers and small plates', default_menu_id, NULL, 1, true),
        ('Main Dishes', 'Main course items', default_menu_id, NULL, 2, true),
        ('Drinks', 'Beverages and refreshments', default_menu_id, NULL, 3, true),
        ('Desserts', 'Sweet treats and desserts', default_menu_id, NULL, 4, true);
        
        RAISE NOTICE '✅ Created default categories (Starters, Main Dishes, Drinks, Desserts) for default menu card.';
    END IF;
END $$;

-- ================================================
-- STEP 7: VERIFICATION QUERIES
-- ================================================
-- Run these to verify everything is working:

-- Check default menu card exists
-- SELECT name, description, is_active FROM menucards WHERE name = 'Main Menu';

-- Check category hierarchy
-- SELECT 
--     c.name as category_name,
--     p.name as parent_name,
--     m.name as menu_name
-- FROM categories c
-- LEFT JOIN categories p ON p.id = c.parent_id
-- LEFT JOIN menucards m ON m.id = c.menucard_id
-- ORDER BY c.sort_order;

RAISE NOTICE '🎯 Menu hierarchy system is ready!';
RAISE NOTICE '📝 All accounts now start with a default "Main Menu" card.';
RAISE NOTICE '🏗️ Categories support parent-child hierarchy: Menu → Categories → Subcategories → Products.';
