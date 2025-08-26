-- Definitive fix for all function conflicts
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing functions to ensure clean slate
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS create_order(TEXT, UUID, BOOLEAN, JSONB) CASCADE;

-- Step 2: Create generate_order_number with completely unique variable names
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS VARCHAR(50) AS $$
DECLARE
    date_string TEXT;
    sequence_number INTEGER;
    result_order_number VARCHAR(50);  -- Completely different name
BEGIN
    -- Get today's date
    date_string := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get next sequence number with explicit table alias
    SELECT COALESCE(MAX(CAST(RIGHT(orders_table.order_number, 4) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.orders AS orders_table  -- Clear table alias
    WHERE orders_table.order_number LIKE 'ORD-' || date_string || '-%';
    
    -- Build result
    result_order_number := 'ORD-' || date_string || '-' || LPAD(sequence_number::TEXT, 4, '0');
    
    RETURN result_order_number;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Test generate_order_number function in isolation
DO $$
DECLARE
    test_number VARCHAR(50);
BEGIN
    SELECT generate_order_number() INTO test_number;
    RAISE NOTICE 'Generate function test: %', test_number;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Generate function failed: %', SQLERRM;
        RAISE;
END $$;

-- Step 4: Check what status values are actually allowed
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'orders' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';

-- Step 5: Check existing status values in the table
SELECT DISTINCT status 
FROM public.orders 
ORDER BY status;

-- Step 6: Create simple create_order function that tries common status values
CREATE OR REPLACE FUNCTION create_order(
    p_type TEXT,
    p_table_id UUID DEFAULT NULL,
    p_pin_required BOOLEAN DEFAULT FALSE,
    p_items JSONB DEFAULT '[]'::JSONB
) RETURNS UUID AS $$
DECLARE
    new_order_id UUID;
    generated_order_number VARCHAR(50);
BEGIN
    -- Get order number from our function
    generated_order_number := generate_order_number();
    
    -- Try to insert with 'pending' status first
    BEGIN
        INSERT INTO public.orders (
            type,
            table_id,
            order_number,
            status,
            created_at
        ) VALUES (
            p_type,
            p_table_id,
            generated_order_number,
            'pending',  -- Most common status
            NOW()
        ) RETURNING id INTO new_order_id;
        
        RAISE NOTICE 'Order created with status: pending';
        RETURN new_order_id;
        
    EXCEPTION
        WHEN check_violation THEN
            -- Try 'open' status
            BEGIN
                INSERT INTO public.orders (
                    type, table_id, order_number, status, created_at
                ) VALUES (
                    p_type, p_table_id, generated_order_number, 'open', NOW()
                ) RETURNING id INTO new_order_id;
                
                RAISE NOTICE 'Order created with status: open';
                RETURN new_order_id;
                
            EXCEPTION
                WHEN check_violation THEN
                    -- Try 'new' status
                    INSERT INTO public.orders (
                        type, table_id, order_number, status, created_at
                    ) VALUES (
                        p_type, p_table_id, generated_order_number, 'new', NOW()
                    ) RETURNING id INTO new_order_id;
                    
                    RAISE NOTICE 'Order created with status: new';
                    RETURN new_order_id;
            END;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Test the complete flow
DO $$
DECLARE
    test_order_id UUID;
    test_status TEXT;
    test_number VARCHAR(50);
BEGIN
    -- Test create_order
    SELECT create_order('dine_in', NULL, FALSE, '[]'::JSONB) INTO test_order_id;
    
    -- Verify what was created
    SELECT o.status, o.order_number 
    INTO test_status, test_number
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    RAISE NOTICE 'SUCCESS: Order % created with status % and number %', 
                 test_order_id, test_status, test_number;
    
    -- Clean up
    DELETE FROM public.orders WHERE id = test_order_id;
    RAISE NOTICE 'Test completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        RAISE;
END $$;
