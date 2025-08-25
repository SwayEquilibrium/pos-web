-- STEP 3: Test the root function
-- Run this after step 2

-- Test if function exists and works
SELECT COUNT(*) as total_root_categories FROM public.get_root_categories();

-- Show actual data
SELECT name, color, emoji, has_children, product_count 
FROM public.get_root_categories() 
LIMIT 5;
