-- Debug script to check modifier_groups table structure and existing data
-- Run this in Supabase SQL Editor to understand the table structure

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'modifier_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing data and type values
SELECT id, name, type, description, min_select, max_select 
FROM public.modifier_groups 
LIMIT 10;

-- Check the constraint definition (for newer PostgreSQL versions)
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.modifier_groups'::regclass 
AND contype = 'c';
