-- STEP 4: Add some sample categories if none exist
-- Run this after step 3

-- Update existing data first
UPDATE public.categories SET 
    color = COALESCE(color, '#3B82F6'),
    emoji = COALESCE(emoji, '📁'),
    display_style = COALESCE(display_style, 'emoji')
WHERE color IS NULL OR emoji IS NULL OR display_style IS NULL;

-- Add sample categories if we have none
INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Mad', 1, 1, '#EF4444', '🍽️', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Mad');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Drikkevarer', 2, 2, '#3B82F6', '🥤', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Drikkevarer');

INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) 
SELECT 'Desserter', 3, 3, '#F59E0B', '🍰', 'emoji'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Desserter');
