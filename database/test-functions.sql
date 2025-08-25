-- Test script to verify our functions work
-- Run this in Supabase SQL Editor to test

-- Test 1: Check if we have any categories at all
SELECT 'Total categories:' as test, COUNT(*) as count FROM public.categories;

-- Test 2: Check root categories function
SELECT 'Root categories function:' as test, COUNT(*) as count FROM public.get_root_categories();

-- Test 3: Show actual root categories data
SELECT 
    'Root category:' as test,
    name,
    color,
    emoji,
    display_style,
    has_children,
    product_count
FROM public.get_root_categories()
LIMIT 5;

-- Test 4: Check if we have any data in categories table
SELECT 
    'Category data:' as test,
    id,
    name,
    parent_id,
    color,
    emoji,
    display_style
FROM public.categories 
LIMIT 5;

-- Test 5: Test subcategories function with NULL (should return root categories)
SELECT 'Subcategories with NULL:' as test, COUNT(*) as count 
FROM public.get_subcategories(NULL);
