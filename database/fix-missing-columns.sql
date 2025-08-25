-- Fix Missing Columns in Tables and Rooms
-- Run this in Supabase SQL Editor to ensure all required columns exist

-- Add missing columns to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- Add missing columns to tables table  
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 60;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 60;

-- Update existing rooms with colors if they don't have them
UPDATE public.rooms 
SET color = CASE 
  WHEN sort_index % 6 = 0 THEN '#EF4444'  -- Red
  WHEN sort_index % 6 = 1 THEN '#F59E0B'  -- Orange
  WHEN sort_index % 6 = 2 THEN '#10B981'  -- Green
  WHEN sort_index % 6 = 3 THEN '#3B82F6'  -- Blue
  WHEN sort_index % 6 = 4 THEN '#8B5CF6'  -- Purple
  ELSE '#EC4899'  -- Pink
END
WHERE color = '#3B82F6';

-- Update existing tables with default coordinates if they don't have them
UPDATE public.tables 
SET 
  x = FLOOR(RANDOM() * 400)::INTEGER,
  y = FLOOR(RANDOM() * 300)::INTEGER
WHERE x = 0 AND y = 0;

-- Test queries to verify everything works
SELECT 'Rooms test' as test, COUNT(*) as count FROM public.rooms;
SELECT 'Tables test' as test, COUNT(*) as count FROM public.tables;
