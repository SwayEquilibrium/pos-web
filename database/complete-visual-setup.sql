-- Complete Visual Customization Setup
-- Run this script in Supabase SQL Editor to add visual features

-- Step 1: Add visual columns to existing tables
-- Add visual fields to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📁';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image'));

-- Add visual fields to products table  
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '🍽️';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image'));

-- Step 2: Create optimized images table for file management
CREATE TABLE IF NOT EXISTS public.optimized_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename TEXT NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    
    -- Optimized versions
    original_url TEXT NOT NULL,
    large_url TEXT,
    medium_url TEXT,
    small_url TEXT,
    thumbnail_url TEXT NOT NULL,
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_optimized_images_hash ON public.optimized_images(file_hash);
CREATE INDEX IF NOT EXISTS idx_optimized_images_usage ON public.optimized_images(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_index ON public.categories(sort_index);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category_id, active);

-- Step 3: Create hierarchy functions
-- Function to get subcategories with visual hierarchy info
CREATE OR REPLACE FUNCTION public.get_subcategories(p_parent_id UUID DEFAULT NULL)
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
        -- Base case: direct children of p_parent_id
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
        WHERE c.parent_id IS NOT DISTINCT FROM p_parent_id
        
        UNION ALL
        
        -- Recursive case: get children of children
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

-- Function to get root categories
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

-- Function to get category breadcrumbs
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

-- Step 4: Image management functions
CREATE OR REPLACE FUNCTION public.increment_image_usage(image_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.optimized_images 
    SET usage_count = usage_count + 1 
    WHERE id = image_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_optimized_image(
    p_file_hash VARCHAR(64),
    p_original_filename TEXT,
    p_file_size_bytes INTEGER,
    p_mime_type VARCHAR(50),
    p_width INTEGER,
    p_height INTEGER,
    p_original_url TEXT,
    p_large_url TEXT DEFAULT NULL,
    p_medium_url TEXT DEFAULT NULL,
    p_small_url TEXT DEFAULT NULL,
    p_thumbnail_url TEXT,
    p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_image_id UUID;
    new_image_id UUID;
BEGIN
    SELECT id INTO existing_image_id 
    FROM public.optimized_images 
    WHERE file_hash = p_file_hash;
    
    IF existing_image_id IS NOT NULL THEN
        PERFORM public.increment_image_usage(existing_image_id);
        RETURN existing_image_id;
    ELSE
        INSERT INTO public.optimized_images (
            original_filename, file_hash, file_size_bytes, mime_type, 
            width, height, original_url, large_url, medium_url, 
            small_url, thumbnail_url, uploaded_by, usage_count
        ) VALUES (
            p_original_filename, p_file_hash, p_file_size_bytes, p_mime_type,
            p_width, p_height, p_original_url, p_large_url, p_medium_url,
            p_small_url, p_thumbnail_url, p_uploaded_by, 1
        ) RETURNING id INTO new_image_id;
        
        RETURN new_image_id;
    END IF;
END;
$$;

-- Step 5: Set up RLS policies for optimized_images
ALTER TABLE public.optimized_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view optimized images" ON public.optimized_images
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload images" ON public.optimized_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own images" ON public.optimized_images
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_subcategories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_root_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_breadcrumbs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_image_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_optimized_image TO authenticated;

-- Step 7: Update existing categories with default visual values
UPDATE public.categories SET 
    color = COALESCE(color, '#3B82F6'),
    emoji = COALESCE(emoji, '📁'),
    display_style = COALESCE(display_style, 'emoji')
WHERE color IS NULL OR emoji IS NULL OR display_style IS NULL;

-- Step 8: Update existing products with default visual values  
UPDATE public.products SET 
    color = COALESCE(color, '#10B981'),
    emoji = COALESCE(emoji, '🍽️'),
    display_style = COALESCE(display_style, 'emoji')
WHERE color IS NULL OR emoji IS NULL OR display_style IS NULL;

-- Step 9: Add some sample visual categories if none exist
INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Mad', 1, 1, '#EF4444', '🍽️', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Mad');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Drikkevarer', 2, 2, '#3B82F6', '🥤', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Drikkevarer');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Desserter', 3, 3, '#F59E0B', '🍰', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Desserter');

-- Step 10: Test the setup
DO $$
BEGIN
    RAISE NOTICE 'Visual customization setup completed successfully!';
    RAISE NOTICE 'Root categories: %', (SELECT COUNT(*) FROM public.get_root_categories());
    RAISE NOTICE 'Total categories: %', (SELECT COUNT(*) FROM public.categories);
    
    -- Test if visual columns exist
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

COMMENT ON TABLE public.optimized_images IS 'Stores optimized images with deduplication for categories and products';
COMMENT ON FUNCTION public.get_subcategories IS 'Gets subcategories with visual hierarchy information';
COMMENT ON FUNCTION public.get_root_categories IS 'Gets root categories with visual styling and counts';
