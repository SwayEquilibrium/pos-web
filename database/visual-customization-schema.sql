-- Visual Customization Schema for Categories and Products
-- This adds support for colors, emojis, and optimized images

-- Add visual fields to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'; -- Hex color
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📁'; -- Unicode emoji
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT; -- Optimized image URL
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT; -- Small thumbnail
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'emoji' CHECK (display_style IN ('emoji', 'color', 'image')); -- Display preference

-- Add visual fields to products table  
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10B981'; -- Hex color
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '🍽️'; -- Unicode emoji
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT; -- Optimized image URL
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT; -- Small thumbnail
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_style VARCHAR(20) DEFAULT 'image' CHECK (display_style IN ('emoji', 'color', 'image')); -- Display preference

-- Create optimized images table for file management and deduplication
CREATE TABLE IF NOT EXISTS public.optimized_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename TEXT NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash for deduplication
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    
    -- Optimized versions
    original_url TEXT NOT NULL, -- Full size optimized
    large_url TEXT, -- 800x600 max
    medium_url TEXT, -- 400x300 max  
    small_url TEXT, -- 200x150 max
    thumbnail_url TEXT NOT NULL, -- 100x100 max
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER NOT NULL DEFAULT 0, -- Track how many times used
    
    -- Indexes
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);

-- Create index for fast hash lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_optimized_images_hash ON public.optimized_images(file_hash);
CREATE INDEX IF NOT EXISTS idx_optimized_images_usage ON public.optimized_images(usage_count DESC);

-- Function to increment usage count when image is used
CREATE OR REPLACE FUNCTION public.increment_image_usage(image_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.optimized_images 
    SET usage_count = usage_count + 1 
    WHERE id = image_id;
END;
$$;

-- Function to get or create optimized image (deduplication)
CREATE OR REPLACE FUNCTION public.get_or_create_optimized_image(
    p_file_hash VARCHAR(64),
    p_original_filename TEXT,
    p_file_size_bytes INTEGER,
    p_mime_type VARCHAR(50),
    p_width INTEGER,
    p_height INTEGER,
    p_original_url TEXT,
    p_large_url TEXT DEFAULT NULL,
    p_medium_url TEXT DEFAULT NULL,
    p_small_url TEXT DEFAULT NULL,
    p_thumbnail_url TEXT,
    p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_image_id UUID;
    new_image_id UUID;
BEGIN
    -- Check if image with this hash already exists
    SELECT id INTO existing_image_id 
    FROM public.optimized_images 
    WHERE file_hash = p_file_hash;
    
    IF existing_image_id IS NOT NULL THEN
        -- Image already exists, increment usage and return existing ID
        PERFORM public.increment_image_usage(existing_image_id);
        RETURN existing_image_id;
    ELSE
        -- Create new optimized image record
        INSERT INTO public.optimized_images (
            original_filename, file_hash, file_size_bytes, mime_type, 
            width, height, original_url, large_url, medium_url, 
            small_url, thumbnail_url, uploaded_by, usage_count
        ) VALUES (
            p_original_filename, p_file_hash, p_file_size_bytes, p_mime_type,
            p_width, p_height, p_original_url, p_large_url, p_medium_url,
            p_small_url, p_thumbnail_url, p_uploaded_by, 1
        ) RETURNING id INTO new_image_id;
        
        RETURN new_image_id;
    END IF;
END;
$$;

-- Function to cleanup unused images (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_unused_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete images that aren't referenced by any categories or products
    -- and have usage_count = 0 and are older than 7 days
    DELETE FROM public.optimized_images 
    WHERE usage_count = 0 
    AND uploaded_at < NOW() - INTERVAL '7 days'
    AND id NOT IN (
        SELECT DISTINCT image_url::UUID FROM public.categories WHERE image_url IS NOT NULL
        UNION
        SELECT DISTINCT image_url::UUID FROM public.products WHERE image_url IS NOT NULL
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- RLS Policies for optimized_images
ALTER TABLE public.optimized_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all images
CREATE POLICY "Anyone can view optimized images" ON public.optimized_images
    FOR SELECT USING (true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON public.optimized_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update own images" ON public.optimized_images
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Sample data with visual customization
INSERT INTO public.categories (name, sort_index, print_sort_index, color, emoji, display_style) VALUES
('Mad', 1, 1, '#EF4444', '🍽️', 'emoji'),
('Drikkevarer', 2, 2, '#3B82F6', '🥤', 'emoji'),
('Desserter', 3, 3, '#F59E0B', '🍰', 'emoji')
ON CONFLICT DO NOTHING;

-- Update existing products with visual styling
UPDATE public.products SET 
    color = '#10B981',
    emoji = '🥗',
    display_style = 'emoji'
WHERE name ILIKE '%salat%';

UPDATE public.products SET 
    color = '#8B5CF6', 
    emoji = '🍞',
    display_style = 'emoji'
WHERE name ILIKE '%bruschetta%';

UPDATE public.products SET 
    color = '#EF4444',
    emoji = '🥩', 
    display_style = 'emoji'
WHERE name ILIKE '%bøf%';

UPDATE public.products SET 
    color = '#F59E0B',
    emoji = '🍝',
    display_style = 'emoji'  
WHERE name ILIKE '%pasta%';

UPDATE public.products SET 
    color = '#8B5CF6',
    emoji = '🍰',
    display_style = 'emoji'
WHERE name ILIKE '%tiramisu%';

-- Create view for easy category/product visual data
CREATE OR REPLACE VIEW public.categories_with_visuals AS
SELECT 
    c.*,
    CASE 
        WHEN c.display_style = 'image' AND c.image_url IS NOT NULL THEN 
            (SELECT thumbnail_url FROM public.optimized_images WHERE id = c.image_url::UUID)
        ELSE NULL
    END as resolved_thumbnail_url,
    CASE 
        WHEN c.display_style = 'image' AND c.image_url IS NOT NULL THEN 
            (SELECT medium_url FROM public.optimized_images WHERE id = c.image_url::UUID)
        ELSE NULL
    END as resolved_medium_url
FROM public.categories c;

CREATE OR REPLACE VIEW public.products_with_visuals AS
SELECT 
    p.*,
    CASE 
        WHEN p.display_style = 'image' AND p.image_url IS NOT NULL THEN 
            (SELECT thumbnail_url FROM public.optimized_images WHERE id = p.image_url::UUID)
        ELSE NULL
    END as resolved_thumbnail_url,
    CASE 
        WHEN p.display_style = 'image' AND p.image_url IS NOT NULL THEN 
            (SELECT medium_url FROM public.optimized_images WHERE id = p.image_url::UUID)
        ELSE NULL
    END as resolved_medium_url
FROM public.products p;

COMMENT ON TABLE public.optimized_images IS 'Stores optimized images with deduplication and multiple sizes for categories and products';
COMMENT ON COLUMN public.categories.display_style IS 'How to display the category: emoji, color, or image';
COMMENT ON COLUMN public.products.display_style IS 'How to display the product: emoji, color, or image';
COMMENT ON FUNCTION public.get_or_create_optimized_image IS 'Deduplicates images by hash and returns existing or new image ID';
COMMENT ON FUNCTION public.cleanup_unused_images IS 'Removes unused images older than 7 days to save storage';
