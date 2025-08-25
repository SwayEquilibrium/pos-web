-- Cleanup and Rebuild Script
-- Run this FIRST to clean up existing functions, then rebuild everything

-- Step 1: Drop existing functions
DROP FUNCTION IF EXISTS public.get_subcategories(uuid);
DROP FUNCTION IF EXISTS public.get_root_categories();
DROP FUNCTION IF EXISTS public.get_category_breadcrumbs(uuid);

-- Step 2: Add visual columns (if not already done)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📁';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image'));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '🍽️';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image'));

-- Step 3: Create get_root_categories function (FIXED)
CREATE OR REPLACE FUNCTION public.get_root_categories()
RETURNS TABLE (
    id UUID,
    name TEXT,
    parent_id UUID,
    sort_index INTEGER,
    print_sort_index INTEGER,
    color VARCHAR(7),
    emoji VARCHAR(10),
    display_style VARCHAR(20),
    image_url TEXT,
    image_thumbnail_url TEXT,
    has_children BOOLEAN,
    product_count BIGINT,
    child_categories BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.sort_index,
        c.print_sort_index,
        COALESCE(c.color, '#3B82F6') as color,
        COALESCE(c.emoji, '📁') as emoji,
        COALESCE(c.display_style, 'emoji') as display_style,
        c.image_url,
        c.image_thumbnail_url,
        EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id = c.id) as has_children,
        COALESCE(p.product_count, 0) as product_count,
        COALESCE(cc.child_count, 0) as child_categories
    FROM public.categories c
    LEFT JOIN (
        SELECT category_id, COUNT(*) as product_count 
        FROM public.products 
        WHERE active = true 
        GROUP BY category_id
    ) p ON c.id = p.category_id
    LEFT JOIN (
        SELECT parent_id, COUNT(*) as child_count
        FROM public.categories
        GROUP BY parent_id
    ) cc ON c.id = cc.parent_id
    WHERE c.parent_id IS NULL
    ORDER BY c.sort_index, c.name;
END;
$$;

-- Step 4: Create get_subcategories function (FIXED with new parameter name)
CREATE OR REPLACE FUNCTION public.get_subcategories(p_parent_category_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    parent_id UUID,
    sort_index INTEGER,
    print_sort_index INTEGER,
    color VARCHAR(7),
    emoji VARCHAR(10),
    display_style VARCHAR(20),
    image_url TEXT,
    image_thumbnail_url TEXT,
    has_children BOOLEAN,
    product_count BIGINT,
    level INTEGER,
    full_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_hierarchy AS (
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.sort_index,
            c.print_sort_index,
            COALESCE(c.color, '#3B82F6') as color,
            COALESCE(c.emoji, '📁') as emoji,
            COALESCE(c.display_style, 'emoji') as display_style,
            c.image_url,
            c.image_thumbnail_url,
            EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id = c.id) as has_children,
            COALESCE(p.product_count, 0) as product_count,
            1 as level,
            c.name as full_path
        FROM public.categories c
        LEFT JOIN (
            SELECT category_id, COUNT(*) as product_count 
            FROM public.products 
            WHERE active = true 
            GROUP BY category_id
        ) p ON c.id = p.category_id
        WHERE c.parent_id IS NOT DISTINCT FROM p_parent_category_id
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.sort_index,
            c.print_sort_index,
            COALESCE(c.color, '#3B82F6') as color,
            COALESCE(c.emoji, '📁') as emoji,
            COALESCE(c.display_style, 'emoji') as display_style,
            c.image_url,
            c.image_thumbnail_url,
            EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id = c.id) as has_children,
            COALESCE(p.product_count, 0) as product_count,
            ch.level + 1,
            ch.full_path || ' → ' || c.name
        FROM public.categories c
        JOIN category_hierarchy ch ON c.parent_id = ch.id
        LEFT JOIN (
            SELECT category_id, COUNT(*) as product_count 
            FROM public.products 
            WHERE active = true 
            GROUP BY category_id
        ) p ON c.id = p.category_id
        WHERE ch.level < 5
    )
    SELECT * FROM category_hierarchy
    ORDER BY sort_index, name;
END;
$$;

-- Step 5: Create get_category_breadcrumbs function
CREATE OR REPLACE FUNCTION public.get_category_breadcrumbs(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    level INTEGER,
    color VARCHAR(7),
    emoji VARCHAR(10),
    display_style VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE breadcrumb_path AS (
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            COALESCE(c.color, '#3B82F6') as color,
            COALESCE(c.emoji, '📁') as emoji,
            COALESCE(c.display_style, 'emoji') as display_style,
            0 as level
        FROM public.categories c
        WHERE c.id = p_category_id
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            COALESCE(c.color, '#3B82F6') as color,
            COALESCE(c.emoji, '📁') as emoji,
            COALESCE(c.display_style, 'emoji') as display_style,
            bp.level + 1
        FROM public.categories c
        JOIN breadcrumb_path bp ON c.id = bp.parent_id
        WHERE bp.level < 10
    )
    SELECT 
        bp.id,
        bp.name,
        bp.level,
        bp.color,
        bp.emoji,
        bp.display_style
    FROM breadcrumb_path bp
    ORDER BY bp.level DESC;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_root_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subcategories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_breadcrumbs(UUID) TO authenticated;

-- Step 7: Update existing data with defaults
UPDATE public.categories SET 
    color = COALESCE(color, '#3B82F6'),
    emoji = COALESCE(emoji, '📁'),
    display_style = COALESCE(display_style, 'emoji')
WHERE color IS NULL OR emoji IS NULL OR display_style IS NULL;

UPDATE public.products SET 
    color = COALESCE(color, '#10B981'),
    emoji = COALESCE(emoji, '🍽️'),
    display_style = COALESCE(display_style, 'emoji')
WHERE color IS NULL OR emoji IS NULL OR display_style IS NULL;

-- Step 8: Add sample categories
INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Mad', 1, 1, '#EF4444', '🍽️', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Mad');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Drikkevarer', 2, 2, '#3B82F6', '🥤', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Drikkevarer');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Desserter', 3, 3, '#F59E0B', '🍰', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Desserter');

-- Step 9: Test everything
DO $$
BEGIN
    RAISE NOTICE '✅ Visual customization setup completed successfully!';
    RAISE NOTICE 'Root categories: %', (SELECT COUNT(*) FROM public.get_root_categories());
    RAISE NOTICE 'Total categories: %', (SELECT COUNT(*) FROM public.categories);
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'color') THEN
        RAISE NOTICE '✅ Categories table has visual columns';
    ELSE
        RAISE NOTICE '❌ Categories table missing visual columns';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'color') THEN
        RAISE NOTICE '✅ Products table has visual columns';
    ELSE
        RAISE NOTICE '❌ Products table missing visual columns';
    END IF;
END $$;
