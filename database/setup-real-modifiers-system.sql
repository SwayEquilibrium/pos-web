-- Real modifier system setup with actual examples
-- Run this in Supabase SQL Editor to create a working modifier system

-- =====================================================
-- 1. CREATE MODIFIER TABLES
-- =====================================================

-- Create modifier_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('variant', 'addon')),
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    sort_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifiers table if it doesn't exist
CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    sort_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_modifiers junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    sort_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, modifier_group_id)
);

-- =====================================================
-- 2. CREATE REAL CATEGORIES AND PRODUCTS
-- =====================================================

-- Add visual customization columns to categories if they don't exist
DO $$ 
BEGIN
    -- Add emoji column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'emoji') THEN
        ALTER TABLE categories ADD COLUMN emoji VARCHAR(10);
    END IF;
    
    -- Add color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'color') THEN
        ALTER TABLE categories ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'image_url') THEN
        ALTER TABLE categories ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add image_thumbnail_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'image_thumbnail_url') THEN
        ALTER TABLE categories ADD COLUMN image_thumbnail_url TEXT;
    END IF;
    
    -- Add display_style column if it doesn't exist (icon, image, color, emoji)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'display_style') THEN
        ALTER TABLE categories ADD COLUMN display_style VARCHAR(20) DEFAULT 'emoji';
    END IF;
END $$;

-- Insert real categories with visual customization
INSERT INTO categories (id, name, parent_id, sort_index, emoji, color, display_style, active) VALUES
    ('cat-forretter', 'Forretter', NULL, 1, '🥗', '#10B981', 'emoji', true),
    ('cat-hovedretter', 'Hovedretter', NULL, 2, '🍽️', '#3B82F6', 'emoji', true),
    ('cat-koed', 'Kød', 'cat-hovedretter', 1, '🥩', '#EF4444', 'emoji', true),
    ('cat-fisk', 'Fisk', 'cat-hovedretter', 2, '🐟', '#06B6D4', 'emoji', true),
    ('cat-vegetar', 'Vegetar', 'cat-hovedretter', 3, '🥬', '#22C55E', 'emoji', true),
    ('cat-desserter', 'Desserter', NULL, 3, '🍰', '#F59E0B', 'emoji', true),
    ('cat-drikkevarer', 'Drikkevarer', NULL, 4, '🥤', '#8B5CF6', 'emoji', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    sort_index = EXCLUDED.sort_index,
    emoji = EXCLUDED.emoji,
    color = EXCLUDED.color,
    display_style = EXCLUDED.display_style,
    active = EXCLUDED.active;

-- Add visual customization columns to products if they don't exist
DO $$ 
BEGIN
    -- Add emoji column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'emoji') THEN
        ALTER TABLE products ADD COLUMN emoji VARCHAR(10);
    END IF;
    
    -- Add color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'color') THEN
        ALTER TABLE products ADD COLUMN color VARCHAR(7) DEFAULT '#10B981';
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add image_thumbnail_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_thumbnail_url') THEN
        ALTER TABLE products ADD COLUMN image_thumbnail_url TEXT;
    END IF;
    
    -- Add display_style column if it doesn't exist (icon, image, color, emoji)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'display_style') THEN
        ALTER TABLE products ADD COLUMN display_style VARCHAR(20) DEFAULT 'emoji';
    END IF;
END $$;

-- Insert real products with visual customization
INSERT INTO products (id, name, description, price, category_id, active, emoji, color, display_style, image_url) VALUES
    ('prod-caesar-salat', 'Caesar Salat', 'Frisk salat med parmesan og croutons', 89.00, 'cat-forretter', true, '🥗', '#22C55E', 'emoji', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=300&fit=crop'),
    ('prod-bruschetta', 'Bruschetta', 'Italiensk brød med tomater og basilikum', 75.00, 'cat-forretter', true, '🍞', '#F59E0B', 'emoji', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300&h=300&fit=crop'),
    ('prod-rejer-hvidlog', 'Rejer i hvidløg', 'Stegte rejer med hvidløg og chili', 125.00, 'cat-forretter', true, '🦐', '#F97316', 'emoji', 'https://images.unsplash.com/photo-1565680018434-b513d5573b07?w=300&h=300&fit=crop'),
    
    ('prod-boef-loeg', 'Bøf med løg', 'Saftig bøf med stegte løg og kartofler', 185.00, 'cat-koed', true, '🥩', '#EF4444', 'emoji', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=300&fit=crop'),
    ('prod-schnitzel', 'Schnitzel', 'Klassisk schnitzel med pommes frites', 165.00, 'cat-koed', true, '🍖', '#DC2626', 'emoji', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop'),
    ('prod-kylling-gratin', 'Kylling gratin', 'Kylling i ovn med ost og grøntsager', 155.00, 'cat-koed', true, '🍗', '#F59E0B', 'emoji', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=300&fit=crop'),
    
    ('prod-grillet-laks', 'Grillet laks', 'Frisk laks med grøntsager og kartofler', 165.00, 'cat-fisk', true, '🐟', '#06B6D4', 'emoji', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop'),
    ('prod-torsk-dild', 'Torsk med dild', 'Dampet torsk med dildsauce', 145.00, 'cat-fisk', true, '🐠', '#0891B2', 'emoji', 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=300&h=300&fit=crop'),
    
    ('prod-pasta-primavera', 'Pasta Primavera', 'Pasta med sæsongrøntsager', 135.00, 'cat-vegetar', true, '🍝', '#22C55E', 'emoji', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=300&fit=crop'),
    ('prod-vegetar-burger', 'Vegetar burger', 'Hjemmelavet vegetar burger med pommes', 125.00, 'cat-vegetar', true, '🍔', '#16A34A', 'emoji', 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300&h=300&fit=crop'),
    
    ('prod-tiramisu', 'Tiramisu', 'Klassisk italiensk dessert', 65.00, 'cat-desserter', true, '🍰', '#A855F7', 'emoji', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=300&fit=crop'),
    ('prod-is-baer', 'Is med bær', 'Vanilje is med friske bær', 55.00, 'cat-desserter', true, '🍨', '#EC4899', 'emoji', 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&h=300&fit=crop'),
    
    ('prod-oel', 'Øl', 'Pilsner 50cl', 45.00, 'cat-drikkevarer', true, '🍺', '#F59E0B', 'emoji', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop'),
    ('prod-roedvin', 'Rødvin', 'Glas rødvin', 65.00, 'cat-drikkevarer', true, '🍷', '#7C2D12', 'emoji', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=300&h=300&fit=crop'),
    ('prod-kaffe', 'Kaffe', 'Espresso eller americano', 35.00, 'cat-drikkevarer', true, '☕', '#92400E', 'emoji', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category_id = EXCLUDED.category_id,
    active = EXCLUDED.active,
    emoji = EXCLUDED.emoji,
    color = EXCLUDED.color,
    display_style = EXCLUDED.display_style,
    image_url = EXCLUDED.image_url;

-- =====================================================
-- 3. CREATE REAL MODIFIER GROUPS WITH EXAMPLES
-- =====================================================

-- Insert real modifier groups
INSERT INTO modifier_groups (id, name, description, type, is_required, max_selections, sort_index) VALUES
    ('group-size', 'Størrelse', 'Vælg størrelse på din ret', 'variant', true, 1, 1),
    ('group-sauces', 'Sovser', 'Vælg sovser til din ret', 'addon', false, 3, 2),
    ('group-extras', 'Tilbehør', 'Extra tilbehør til din ret', 'addon', false, 5, 3),
    ('group-cooking', 'Tilberedning', 'Hvordan skal det tilberedes?', 'variant', true, 1, 4),
    ('group-drinks-size', 'Størrelse', 'Vælg størrelse på din drik', 'variant', false, 1, 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    is_required = EXCLUDED.is_required,
    max_selections = EXCLUDED.max_selections,
    sort_index = EXCLUDED.sort_index;

-- =====================================================
-- 4. CREATE REAL MODIFIERS
-- =====================================================

-- Size modifiers
INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_index) VALUES
    ('mod-size-small', 'group-size', 'Lille', -15.00, false, 1),
    ('mod-size-normal', 'group-size', 'Normal', 0.00, true, 2),
    ('mod-size-large', 'group-size', 'Stor (+50g)', 25.00, false, 3),
    ('mod-size-xl', 'group-size', 'XL (+100g)', 45.00, false, 4)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    sort_index = EXCLUDED.sort_index;

-- Sauce modifiers
INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_index) VALUES
    ('mod-sauce-ketchup', 'group-sauces', 'Ketchup', 0.00, true, 1),
    ('mod-sauce-mayo', 'group-sauces', 'Mayo', 0.00, false, 2),
    ('mod-sauce-bbq', 'group-sauces', 'BBQ Sauce', 3.00, false, 3),
    ('mod-sauce-bearnaise', 'group-sauces', 'Bearnaise', 15.00, false, 4),
    ('mod-sauce-hot', 'group-sauces', 'Hot Sauce', 2.00, false, 5),
    ('mod-sauce-aioli', 'group-sauces', 'Hvidløg Aioli', 5.00, false, 6)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    sort_index = EXCLUDED.sort_index;

-- Extra modifiers
INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_index) VALUES
    ('mod-extra-onions', 'group-extras', 'Extra løg', 10.00, false, 1),
    ('mod-extra-fries', 'group-extras', 'Pommes frites', 20.00, false, 2),
    ('mod-extra-salad', 'group-extras', 'Salat', 12.00, false, 3),
    ('mod-extra-cheese', 'group-extras', 'Extra ost', 8.00, false, 4),
    ('mod-extra-bacon', 'group-extras', 'Bacon', 15.00, false, 5),
    ('mod-extra-mushrooms', 'group-extras', 'Svampe', 6.00, false, 6)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    sort_index = EXCLUDED.sort_index;

-- Cooking modifiers
INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_index) VALUES
    ('mod-cook-rare', 'group-cooking', 'Rå', 0.00, false, 1),
    ('mod-cook-medium-rare', 'group-cooking', 'Medium-rå', 0.00, false, 2),
    ('mod-cook-medium', 'group-cooking', 'Medium', 0.00, true, 3),
    ('mod-cook-well-done', 'group-cooking', 'Gennemstegt', 0.00, false, 4)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    sort_index = EXCLUDED.sort_index;

-- Drink size modifiers
INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_index) VALUES
    ('mod-drink-small', 'group-drinks-size', 'Lille (33cl)', -5.00, false, 1),
    ('mod-drink-normal', 'group-drinks-size', 'Normal (50cl)', 0.00, true, 2),
    ('mod-drink-large', 'group-drinks-size', 'Stor (75cl)', 15.00, false, 3)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    sort_index = EXCLUDED.sort_index;

-- =====================================================
-- 5. LINK PRODUCTS TO MODIFIER GROUPS
-- =====================================================

-- Link Bøf med løg to modifiers (size, sauces, extras, cooking)
INSERT INTO product_modifiers (product_id, modifier_group_id, is_required, sort_index) VALUES
    ('prod-boef-loeg', 'group-size', true, 1),
    ('prod-boef-loeg', 'group-cooking', true, 2),
    ('prod-boef-loeg', 'group-sauces', false, 3),
    ('prod-boef-loeg', 'group-extras', false, 4)
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_index = EXCLUDED.sort_index;

-- Link Schnitzel to modifiers (size, sauces, extras)
INSERT INTO product_modifiers (product_id, modifier_group_id, is_required, sort_index) VALUES
    ('prod-schnitzel', 'group-size', true, 1),
    ('prod-schnitzel', 'group-sauces', false, 2),
    ('prod-schnitzel', 'group-extras', false, 3)
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_index = EXCLUDED.sort_index;

-- Link Vegetar burger to modifiers (size, sauces, extras)
INSERT INTO product_modifiers (product_id, modifier_group_id, is_required, sort_index) VALUES
    ('prod-vegetar-burger', 'group-size', false, 1),
    ('prod-vegetar-burger', 'group-sauces', false, 2),
    ('prod-vegetar-burger', 'group-extras', false, 3)
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_index = EXCLUDED.sort_index;

-- Link Caesar Salat to modifiers (sauces, extras)
INSERT INTO product_modifiers (product_id, modifier_group_id, is_required, sort_index) VALUES
    ('prod-caesar-salat', 'group-sauces', false, 1),
    ('prod-caesar-salat', 'group-extras', false, 2)
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_index = EXCLUDED.sort_index;

-- Link drinks to size modifiers
INSERT INTO product_modifiers (product_id, modifier_group_id, is_required, sort_index) VALUES
    ('prod-oel', 'group-drinks-size', false, 1),
    ('prod-kaffe', 'group-drinks-size', false, 1)
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    sort_index = EXCLUDED.sort_index;

-- =====================================================
-- 6. CREATE/UPDATE DATABASE FUNCTIONS
-- =====================================================

-- Function to get modifiers for a product
CREATE OR REPLACE FUNCTION get_product_modifiers(product_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    group_type VARCHAR(20),
    group_required BOOLEAN,
    modifier_id UUID,
    modifier_name VARCHAR(255),
    modifier_price DECIMAL(10,2),
    modifier_sort INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mg.id as group_id,
        mg.name as group_name,
        mg.type as group_type,
        pm.is_required as group_required,
        m.id as modifier_id,
        m.name as modifier_name,
        m.price_adjustment as modifier_price,
        m.sort_index as modifier_sort
    FROM product_modifiers pm
    JOIN modifier_groups mg ON pm.modifier_group_id = mg.id
    JOIN modifiers m ON mg.id = m.group_id
    WHERE pm.product_id = product_uuid
      AND mg.active = true
      AND m.active = true
    ORDER BY pm.sort_index, mg.sort_index, m.sort_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get modifier groups for a product
CREATE OR REPLACE FUNCTION get_modifier_groups_for_product(product_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    group_type VARCHAR(20),
    group_required BOOLEAN,
    group_description TEXT,
    max_selections INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mg.id as group_id,
        mg.name as group_name,
        mg.type as group_type,
        pm.is_required as group_required,
        mg.description as group_description,
        mg.max_selections
    FROM product_modifiers pm
    JOIN modifier_groups mg ON pm.modifier_group_id = mg.id
    WHERE pm.product_id = product_uuid
      AND mg.active = true
    ORDER BY pm.sort_index, mg.sort_index;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY (if needed)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on modifier_groups" ON modifier_groups FOR ALL USING (true);
CREATE POLICY "Allow all operations on modifiers" ON modifiers FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_modifiers" ON product_modifiers FOR ALL USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the functions
SELECT 'Testing get_product_modifiers for Bøf med løg:' as test;
SELECT * FROM get_product_modifiers('prod-boef-loeg');

SELECT 'Testing get_modifier_groups_for_product for Bøf med løg:' as test;
SELECT * FROM get_modifier_groups_for_product('prod-boef-loeg');

-- Show all products with modifier counts
SELECT 
    p.id,
    p.name,
    COUNT(pm.modifier_group_id) as modifier_groups_count
FROM products p
LEFT JOIN product_modifiers pm ON p.id = pm.product_id
WHERE p.active = true
GROUP BY p.id, p.name
ORDER BY p.name;

SELECT 'Setup completed successfully!' as result;
