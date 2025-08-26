-- Add description column to products table
-- Run this in Supabase SQL Editor

-- Add description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Added description column to products table';
    ELSE
        RAISE NOTICE 'Description column already exists in products table';
    END IF;
END $$;

-- Update the existing products to have empty description if needed
UPDATE public.products 
SET description = '' 
WHERE description IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.products.description IS 'Product description for menu display and order details';
