-- STEP 2: Create get_root_categories function
-- Run this after step 1

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
