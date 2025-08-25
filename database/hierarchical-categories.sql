-- ================================================
-- HIERARCHICAL CATEGORIES UPDATE
-- ================================================

-- Update categories table to better support hierarchy
-- The parent_id field already exists, but let's add some helper functions

-- Function to get category hierarchy path
CREATE OR REPLACE FUNCTION public.get_category_path(p_category_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_path TEXT := '';
  v_current_id UUID := p_category_id;
  v_current_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Build path from current category up to root
  WHILE v_current_id IS NOT NULL LOOP
    SELECT name, parent_id INTO v_current_name, v_parent_id
    FROM public.categories 
    WHERE id = v_current_id;
    
    IF v_current_name IS NULL THEN
      EXIT;
    END IF;
    
    IF v_path = '' THEN
      v_path := v_current_name;
    ELSE
      v_path := v_current_name || ' > ' || v_path;
    END IF;
    
    v_current_id := v_parent_id;
  END LOOP;
  
  RETURN v_path;
END;
$$;

-- Function to get all subcategories of a category
CREATE OR REPLACE FUNCTION public.get_subcategories(p_parent_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  parent_id UUID,
  sort_index INTEGER,
  has_children BOOLEAN,
  product_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.sort_index,
    EXISTS(SELECT 1 FROM public.categories sc WHERE sc.parent_id = c.id) as has_children,
    COUNT(p.id) as product_count
  FROM public.categories c
  LEFT JOIN public.products p ON p.category_id = c.id AND p.active = true
  WHERE c.parent_id IS NOT DISTINCT FROM p_parent_id
  GROUP BY c.id, c.name, c.parent_id, c.sort_index
  ORDER BY c.sort_index, c.name;
END;
$$;

-- Function to get category breadcrumbs
CREATE OR REPLACE FUNCTION public.get_category_breadcrumbs(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  level INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_id UUID := p_category_id;
  v_level INTEGER := 0;
  v_breadcrumbs UUID[];
  v_names TEXT[];
  v_item UUID;
  v_name TEXT;
BEGIN
  -- Build breadcrumb trail
  WHILE v_current_id IS NOT NULL LOOP
    SELECT c.name, c.parent_id INTO v_name, v_current_id
    FROM public.categories c 
    WHERE c.id = v_current_id;
    
    IF v_name IS NULL THEN
      EXIT;
    END IF;
    
    v_breadcrumbs := array_prepend(COALESCE(v_current_id, p_category_id), v_breadcrumbs);
    v_names := array_prepend(v_name, v_names);
    v_level := v_level + 1;
    
    -- Prevent infinite loops
    IF v_level > 10 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Return breadcrumbs in correct order
  FOR i IN 1..array_length(v_breadcrumbs, 1) LOOP
    id := v_breadcrumbs[i];
    name := v_names[i];
    level := i - 1;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Add some sample hierarchical categories
INSERT INTO public.categories (name, parent_id, sort_index) VALUES
('Mad', NULL, 1),
('Drikkevarer', NULL, 2),
('Desserter', NULL, 3)
ON CONFLICT DO NOTHING;

-- Add subcategories under "Mad"
INSERT INTO public.categories (name, parent_id, sort_index)
SELECT 'Forretter', c.id, 1 FROM public.categories c WHERE c.name = 'Mad' AND c.parent_id IS NULL
UNION ALL
SELECT 'Hovedretter', c.id, 2 FROM public.categories c WHERE c.name = 'Mad' AND c.parent_id IS NULL
UNION ALL
SELECT 'Pizza', c.id, 3 FROM public.categories c WHERE c.name = 'Mad' AND c.parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Add subcategories under "Drikkevarer"
INSERT INTO public.categories (name, parent_id, sort_index)
SELECT 'Kaffe', c.id, 1 FROM public.categories c WHERE c.name = 'Drikkevarer' AND c.parent_id IS NULL
UNION ALL
SELECT 'Sodavand', c.id, 2 FROM public.categories c WHERE c.name = 'Drikkevarer' AND c.parent_id IS NULL
UNION ALL
SELECT 'Øl', c.id, 3 FROM public.categories c WHERE c.name = 'Drikkevarer' AND c.parent_id IS NULL
ON CONFLICT DO NOTHING;

-- Add some sub-subcategories under Pizza
INSERT INTO public.categories (name, parent_id, sort_index)
SELECT 'Klassisk Pizza', p.id, 1 FROM public.categories p 
JOIN public.categories parent ON parent.id = p.parent_id
WHERE p.name = 'Pizza' AND parent.name = 'Mad'
UNION ALL
SELECT 'Gourmet Pizza', p.id, 2 FROM public.categories p 
JOIN public.categories parent ON parent.id = p.parent_id
WHERE p.name = 'Pizza' AND parent.name = 'Mad'
ON CONFLICT DO NOTHING;

-- Enable RLS policies for the new functions
CREATE POLICY "Allow read for authenticated users" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for anonymous users" ON public.categories FOR SELECT TO anon USING (true);
