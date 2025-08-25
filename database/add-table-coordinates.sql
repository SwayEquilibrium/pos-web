-- Add x,y coordinates to tables for 2D layout designer
-- Run this in Supabase SQL Editor

-- Add coordinate columns to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS x INTEGER DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS y INTEGER DEFAULT 0;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 60;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 60;

-- Update existing tables with random positions (optional)
UPDATE public.tables 
SET 
  x = FLOOR(RANDOM() * 400)::INTEGER,
  y = FLOOR(RANDOM() * 300)::INTEGER,
  width = 60,
  height = 60
WHERE x = 0 AND y = 0;

-- Add color column to rooms for visual distinction
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- Update existing rooms with different colors
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

-- Create index for better performance when querying by room
CREATE INDEX IF NOT EXISTS idx_tables_room_id ON public.tables(room_id);
CREATE INDEX IF NOT EXISTS idx_tables_coordinates ON public.tables(x, y);
