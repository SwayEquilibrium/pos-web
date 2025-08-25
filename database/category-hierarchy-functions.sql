-- Category Hierarchy Functions for Visual Navigation
-- This creates the missing functions and improves hierarchy display

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
            c.color,
            c.emoji,
            c.display_style,
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
        
        -- Recursive case: get children of children (for full hierarchy view)
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.sort_index,
            c.print_sort_index,
            c.color,
            c.emoji,
            c.display_style,
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
        WHERE ch.level < 5 -- Prevent infinite recursion
    )
    SELECT * FROM category_hierarchy
    ORDER BY sort_index, name;
END;
$$;

-- Function to get root categories (top level)
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
        c.color,
        c.emoji,
        c.display_style,
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

-- Function to get category breadcrumbs (full path)
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
        -- Start with the target category
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.color,
            c.emoji,
            c.display_style,
            0 as level
        FROM public.categories c
        WHERE c.id = p_category_id
        
        UNION ALL
        
        -- Recursively get parent categories
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.color,
            c.emoji,
            c.display_style,
            bp.level + 1
        FROM public.categories c
        JOIN breadcrumb_path bp ON c.id = bp.parent_id
        WHERE bp.level < 10 -- Prevent infinite recursion
    )
    SELECT 
        bp.id,
        bp.name,
        bp.level,
        bp.color,
        bp.emoji,
        bp.display_style
    FROM breadcrumb_path bp
    ORDER BY bp.level DESC; -- Root first, target last
END;
$$;

-- Function to get category with full hierarchy context
CREATE OR REPLACE FUNCTION public.get_category_with_context(p_category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    parent_id UUID,
    full_path TEXT,
    level INTEGER,
    color VARCHAR(7),
    emoji VARCHAR(10),
    display_style VARCHAR(20),
    image_url TEXT,
    image_thumbnail_url TEXT,
    has_children BOOLEAN,
    has_products BOOLEAN,
    total_descendants INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_path AS (
        -- Get path to root
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.name as path_segment,
            0 as level
        FROM public.categories c
        WHERE c.id = p_category_id
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name,
            c.parent_id,
            c.name as path_segment,
            cp.level + 1
        FROM public.categories c
        JOIN category_path cp ON c.id = cp.parent_id
    ),
    full_path_cte AS (
        SELECT string_agg(path_segment, ' → ' ORDER BY level DESC) as full_path
        FROM category_path
    ),
    descendant_count AS (
        SELECT COUNT(*) as total_count
        FROM public.categories
        WHERE parent_id = p_category_id
    )
    SELECT 
        c.id,
        c.name,
        c.parent_id,
        fp.full_path,
        (SELECT MAX(level) FROM category_path) as level,
        c.color,
        c.emoji,
        c.display_style,
        c.image_url,
        c.image_thumbnail_url,
        EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id = c.id) as has_children,
        EXISTS(SELECT 1 FROM public.products p WHERE p.category_id = c.id AND p.active = true) as has_products,
        COALESCE(dc.total_count, 0)::INTEGER as total_descendants
    FROM public.categories c
    CROSS JOIN full_path_cte fp
    LEFT JOIN descendant_count dc ON true
    WHERE c.id = p_category_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_index ON public.categories(sort_index);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category_id, active);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subcategories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_root_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_breadcrumbs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_with_context(UUID) TO authenticated;

-- Test the functions with sample data
DO $$
BEGIN
    -- Only run if we have categories
    IF EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
        RAISE NOTICE 'Testing category hierarchy functions...';
        
        -- Test root categories
        RAISE NOTICE 'Root categories: %', (
            SELECT COUNT(*) FROM public.get_root_categories()
        );
        
        -- Test subcategories (should work even with NULL)
        RAISE NOTICE 'Subcategories of NULL: %', (
            SELECT COUNT(*) FROM public.get_subcategories(NULL)
        );
        
        RAISE NOTICE 'Category hierarchy functions created successfully!';
    END IF;
END $$;

COMMENT ON FUNCTION public.get_subcategories IS 'Gets subcategories with hierarchy info including visual styling and product counts';
COMMENT ON FUNCTION public.get_root_categories IS 'Gets top-level categories with child counts and visual styling';
COMMENT ON FUNCTION public.get_category_breadcrumbs IS 'Gets breadcrumb path for a category from root to target';
COMMENT ON FUNCTION public.get_category_with_context IS 'Gets category with full hierarchy context and descendant info';
