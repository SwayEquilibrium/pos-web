-- STEP 5: Create get_subcategories function
-- Run this after the root categories function works

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
        -- Base case: direct children of the parent category
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
        
        -- Recursive case: children of children
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
        WHERE ch.level < 5  -- Prevent infinite recursion
    )
    SELECT * FROM category_hierarchy
    ORDER BY level, sort_index, name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_subcategories(UUID) TO authenticated;
