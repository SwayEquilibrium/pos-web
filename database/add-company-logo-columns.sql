-- Quick Fix: Add missing company columns
-- Run this in Supabase SQL Editor to fix the business settings form

-- Add logo_url column
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;

-- Add receipt_message column  
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS receipt_message text;

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' 
    AND column_name IN ('logo_url', 'receipt_message')
ORDER BY column_name;
