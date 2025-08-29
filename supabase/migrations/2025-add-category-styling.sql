-- Migration: Add styling columns to categories table
-- This allows categories to have emojis, colors, images, and display styles
-- Following the same pattern as products for consistency

-- Add styling columns to categories table if they don't exist
DO $$ BEGIN
  -- Add emoji column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'emoji') then
    alter table public.categories add column emoji text;
  end if;
  
  -- Add color column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'color') then
    alter table public.categories add column color text;
  end if;
  
  -- Add image_url column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'image_url') then
    alter table public.categories add column image_url text;
  end if;
  
  -- Add display_style column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'categories' and column_name = 'display_style') then
    alter table public.categories add column display_style text default 'emoji' check (display_style in ('emoji', 'color', 'image', 'text'));
  end if;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.categories.emoji IS 'Emoji icon for the category (e.g., 🍕, 🍰)';
COMMENT ON COLUMN public.categories.color IS 'Hex color code for the category (e.g., #FF6B6B)';
COMMENT ON COLUMN public.categories.image_url IS 'URL to category image';
COMMENT ON COLUMN public.categories.display_style IS 'How to display the category: emoji, color, image, or text';

-- Update existing categories to have a default display style
UPDATE public.categories SET display_style = 'emoji' WHERE display_style IS NULL;
