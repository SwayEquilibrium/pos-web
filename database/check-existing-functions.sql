-- Check what functions currently exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%categor%'
ORDER BY routine_name;

-- Check what columns exist in categories table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'categories'
ORDER BY ordinal_position;
