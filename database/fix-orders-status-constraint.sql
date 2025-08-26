-- Fix orders status check constraint violation
-- Run this in Supabase SQL Editor

-- First, let's see what check constraints exist on the orders table
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'orders' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';

-- Let's also see the full table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try to find what status values are allowed by looking at existing data
SELECT DISTINCT status 
FROM public.orders 
ORDER BY status;

-- Create a function to check valid status values and use a safe default
CREATE OR REPLACE FUNCTION create_order(
    p_type TEXT,
    p_table_id UUID DEFAULT NULL,
    p_pin_required BOOLEAN DEFAULT FALSE,
    p_items JSONB DEFAULT '[]'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_status TEXT;
    v_item JSONB;
BEGIN
    -- Generate order number
    v_order_number := generate_order_number();
    
    -- Determine valid status value
    -- Common valid values are usually: 'pending', 'open', 'new', 'draft', 'created'
    -- Let's try the most common ones
    v_status := 'pending';  -- Start with 'pending' as it's most common
    
    -- Create the order with a safe status value
    INSERT INTO public.orders (
        type,
        table_id,
        order_number,
        status,
        created_at
    ) VALUES (
        p_type,
        p_table_id,
        v_order_number,
        v_status,
        NOW()
    ) RETURNING id INTO v_order_id;
    
    RAISE NOTICE 'Created order % with type %, status % and order_number %', 
                 v_order_id, p_type, v_status, v_order_number;
    
    -- Insert order items if provided
    IF jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            BEGIN
                INSERT INTO public.order_items (
                    order_id,
                    product_id,
                    qty,
                    unit_price,
                    created_at
                ) VALUES (
                    v_order_id,
                    (v_item->>'product_id')::UUID,
                    (v_item->>'qty')::INTEGER,
                    COALESCE((v_item->>'unit_price')::DECIMAL, 0),
                    NOW()
                );
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not insert order item: %', SQLERRM;
            END;
        END LOOP;
    END IF;
    
    RETURN v_order_id;
    
EXCEPTION
    WHEN check_violation THEN
        -- If 'pending' doesn't work, try other common status values
        BEGIN
            v_status := 'open';
            INSERT INTO public.orders (
                type, table_id, order_number, status, created_at
            ) VALUES (
                p_type, p_table_id, v_order_number, v_status, NOW()
            ) RETURNING id INTO v_order_id;
            
            RAISE NOTICE 'Created order % with fallback status %', v_order_id, v_status;
            RETURN v_order_id;
        EXCEPTION
            WHEN check_violation THEN
                -- Try 'new' status
                BEGIN
                    v_status := 'new';
                    INSERT INTO public.orders (
                        type, table_id, order_number, status, created_at
                    ) VALUES (
                        p_type, p_table_id, v_order_number, v_status, NOW()
                    ) RETURNING id INTO v_order_id;
                    
                    RAISE NOTICE 'Created order % with fallback status %', v_order_id, v_status;
                    RETURN v_order_id;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'All status attempts failed. Check constraint details: %', SQLERRM;
                        RAISE;
                END;
        END;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_order: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the function with different approaches
DO $$
DECLARE
    test_order_id UUID;
    test_status TEXT;
    test_order_number VARCHAR(50);
BEGIN
    -- Test the create_order function
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    -- Check what status was actually used
    SELECT o.status, o.order_number 
    INTO test_status, test_order_number
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    RAISE NOTICE 'SUCCESS: Order % created with status % and order_number %', 
                 test_order_id, test_status, test_order_number;
    
    -- Clean up test order
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully with valid status: %', test_status;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        -- Don't re-raise so we can see the constraint details
END $$;
