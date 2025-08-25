-- STEP 1: Add visual columns to categories table
-- Run this first

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📁';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image'));
