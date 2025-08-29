-- Migration: Add missing company columns for logo and receipt message
-- Justification: Business settings form requires these fields but they don't exist in the database
-- This extends the existing companies table without creating new tables

-- Add logo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN logo_url text;
        RAISE NOTICE 'Added logo_url column to companies table';
    ELSE
        RAISE NOTICE 'logo_url column already exists in companies table';
    END IF;
END $$;

-- Add receipt_message column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'receipt_message'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN receipt_message text;
        RAISE NOTICE 'Added receipt_message column to companies table';
    ELSE
        RAISE NOTICE 'receipt_message column already exists in companies table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
    AND column_name IN ('logo_url', 'receipt_message')
ORDER BY column_name;
