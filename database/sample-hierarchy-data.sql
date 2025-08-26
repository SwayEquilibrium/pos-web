-- Sample Hierarchical Category Data
-- This demonstrates the smart category hierarchy system
-- Example: Wine Card → Red Wines → Bottle of Wine

-- First, clear existing sample data (be careful in production!)
-- DELETE FROM public.products WHERE category_id IN (SELECT id FROM public.categories WHERE name LIKE '%Sample%');
-- DELETE FROM public.categories WHERE name LIKE '%Sample%';

-- Create Master Categories (Level 1)
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style) VALUES
('Wine Card', NULL, 1, '#8B0000', '🍷', 'emoji'),
('Food Menu', NULL, 2, '#228B22', '🍽️', 'emoji'),
('Beverages', NULL, 3, '#4169E1', '🥤', 'emoji'),
('Desserts', NULL, 4, '#FF69B4', '🍰', 'emoji')
ON CONFLICT (name) DO NOTHING;

-- Create Level 2 Categories under Wine Card
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style)
SELECT 'Red Wines', c.id, 1, '#8B0000', '🍷', 'emoji' FROM public.categories c WHERE c.name = 'Wine Card' AND c.parent_id IS NULL
UNION ALL
SELECT 'White Wines', c.id, 2, '#F5F5DC', '🥂', 'emoji' FROM public.categories c WHERE c.name = 'Wine Card' AND c.parent_id IS NULL
UNION ALL
SELECT 'Rosé Wines', c.id, 3, '#FF69B4', '🌹', 'emoji' FROM public.categories c WHERE c.name = 'Wine Card' AND c.parent_id IS NULL
UNION ALL
SELECT 'Sparkling Wines', c.id, 4, '#FFD700', '🍾', 'emoji' FROM public.categories c WHERE c.name = 'Wine Card' AND c.parent_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Create Level 3 Categories under Red Wines
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style)
SELECT 'Bottle of Wine', rw.id, 1, '#8B0000', '🍷', 'emoji' 
FROM public.categories rw 
JOIN public.categories wc ON rw.parent_id = wc.id 
WHERE rw.name = 'Red Wines' AND wc.name = 'Wine Card'
UNION ALL
SELECT 'Glass of Wine', rw.id, 2, '#DC143C', '🥃', 'emoji' 
FROM public.categories rw 
JOIN public.categories wc ON rw.parent_id = wc.id 
WHERE rw.name = 'Red Wines' AND wc.name = 'Wine Card'
ON CONFLICT (name) DO NOTHING;

-- Create Level 2 Categories under Food Menu
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style)
SELECT 'Starters', c.id, 1, '#32CD32', '🥗', 'emoji' FROM public.categories c WHERE c.name = 'Food Menu' AND c.parent_id IS NULL
UNION ALL
SELECT 'Main Courses', c.id, 2, '#228B22', '🍖', 'emoji' FROM public.categories c WHERE c.name = 'Food Menu' AND c.parent_id IS NULL
UNION ALL
SELECT 'Pizza', c.id, 3, '#FF4500', '🍕', 'emoji' FROM public.categories c WHERE c.name = 'Food Menu' AND c.parent_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Create Level 3 Categories under Pizza
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style)
SELECT 'Classic Pizzas', p.id, 1, '#FF4500', '🍕', 'emoji' 
FROM public.categories p 
JOIN public.categories fm ON p.parent_id = fm.id 
WHERE p.name = 'Pizza' AND fm.name = 'Food Menu'
UNION ALL
SELECT 'Gourmet Pizzas', p.id, 2, '#FF6347', '🍕', 'emoji' 
FROM public.categories p 
JOIN public.categories fm ON p.parent_id = fm.id 
WHERE p.name = 'Pizza' AND fm.name = 'Food Menu'
UNION ALL
SELECT 'Vegetarian Pizzas', p.id, 3, '#9ACD32', '🥬', 'emoji' 
FROM public.categories p 
JOIN public.categories fm ON p.parent_id = fm.id 
WHERE p.name = 'Pizza' AND fm.name = 'Food Menu'
ON CONFLICT (name) DO NOTHING;

-- Create Level 2 Categories under Beverages
INSERT INTO public.categories (name, parent_id, sort_index, color, emoji, display_style)
SELECT 'Hot Drinks', c.id, 1, '#8B4513', '☕', 'emoji' FROM public.categories c WHERE c.name = 'Beverages' AND c.parent_id IS NULL
UNION ALL
SELECT 'Cold Drinks', c.id, 2, '#00BFFF', '🧊', 'emoji' FROM public.categories c WHERE c.name = 'Beverages' AND c.parent_id IS NULL
UNION ALL
SELECT 'Soft Drinks', c.id, 3, '#FF1493', '🥤', 'emoji' FROM public.categories c WHERE c.name = 'Beverages' AND c.parent_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Add some sample products to demonstrate the hierarchy
-- Products for "Bottle of Wine" category
INSERT INTO public.products (name, category_id, price, is_open_price, active, color, emoji, display_style)
SELECT 'Château Margaux 2015', c.id, 450.00, false, true, '#8B0000', '🍷', 'emoji'
FROM public.categories c 
WHERE c.name = 'Bottle of Wine'
UNION ALL
SELECT 'Barolo Brunate 2018', c.id, 320.00, false, true, '#8B0000', '🍷', 'emoji'
FROM public.categories c 
WHERE c.name = 'Bottle of Wine'
UNION ALL
SELECT 'Cabernet Sauvignon Reserve', c.id, 180.00, false, true, '#8B0000', '🍷', 'emoji'
FROM public.categories c 
WHERE c.name = 'Bottle of Wine'
ON CONFLICT (name) DO NOTHING;

-- Products for "Glass of Wine" category
INSERT INTO public.products (name, category_id, price, is_open_price, active, color, emoji, display_style)
SELECT 'House Red Wine', c.id, 65.00, false, true, '#DC143C', '🥃', 'emoji'
FROM public.categories c 
WHERE c.name = 'Glass of Wine'
UNION ALL
SELECT 'Premium Red Wine', c.id, 95.00, false, true, '#DC143C', '🥃', 'emoji'
FROM public.categories c 
WHERE c.name = 'Glass of Wine'
ON CONFLICT (name) DO NOTHING;

-- Products for "Classic Pizzas" category
INSERT INTO public.products (name, category_id, price, is_open_price, active, color, emoji, display_style)
SELECT 'Margherita', c.id, 89.00, false, true, '#FF4500', '🍕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Classic Pizzas'
UNION ALL
SELECT 'Pepperoni', c.id, 109.00, false, true, '#FF4500', '🍕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Classic Pizzas'
UNION ALL
SELECT 'Hawaiian', c.id, 119.00, false, true, '#FF4500', '🍕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Classic Pizzas'
ON CONFLICT (name) DO NOTHING;

-- Products for "Hot Drinks" category
INSERT INTO public.products (name, category_id, price, is_open_price, active, color, emoji, display_style)
SELECT 'Espresso', c.id, 25.00, false, true, '#8B4513', '☕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Hot Drinks'
UNION ALL
SELECT 'Cappuccino', c.id, 35.00, false, true, '#8B4513', '☕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Hot Drinks'
UNION ALL
SELECT 'Latte', c.id, 40.00, false, true, '#8B4513', '☕', 'emoji'
FROM public.categories c 
WHERE c.name = 'Hot Drinks'
ON CONFLICT (name) DO NOTHING;

-- Verify the hierarchy was created correctly
SELECT 
  CASE 
    WHEN parent_id IS NULL THEN '📁 ' || name || ' (Level 1)'
    WHEN EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id = c.id) THEN 
      '  📂 ' || name || ' (Level 2)'
    ELSE 
      '    📄 ' || name || ' (Level 3)'
  END as hierarchy,
  id,
  parent_id,
  (SELECT COUNT(*) FROM public.products p WHERE p.category_id = c.id AND p.active = true) as product_count
FROM public.categories c
ORDER BY 
  COALESCE((SELECT cc.sort_index FROM public.categories cc WHERE cc.id = c.parent_id AND cc.parent_id IS NULL), c.sort_index),
  c.sort_index,
  c.name;

-- Show products grouped by their category hierarchy
SELECT 
  CONCAT(
    COALESCE(grandparent.name || ' → ', ''),
    COALESCE(parent.name || ' → ', ''),
    cat.name
  ) as full_category_path,
  p.name as product_name,
  p.price || ' kr' as price
FROM public.products p
JOIN public.categories cat ON p.category_id = cat.id
LEFT JOIN public.categories parent ON cat.parent_id = parent.id
LEFT JOIN public.categories grandparent ON parent.parent_id = grandparent.id
WHERE p.active = true
ORDER BY 
  grandparent.sort_index NULLS FIRST,
  parent.sort_index NULLS FIRST,
  cat.sort_index,
  p.name;

COMMENT ON TABLE public.categories IS 'Hierarchical category system supporting multi-level organization (e.g., Wine Card → Red Wines → Bottle of Wine)';
