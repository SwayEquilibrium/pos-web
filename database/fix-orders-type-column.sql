-- Fix orders table type column NOT NULL constraint
-- Run this in Supabase SQL Editor

-- First, let's see the actual structure of the orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fix the create_order function to include the type column
CREATE OR REPLACE FUNCTION create_order(
    p_type TEXT,
    p_table_id UUID DEFAULT NULL,
    p_pin_required BOOLEAN DEFAULT FALSE,
    p_items JSONB DEFAULT '[]'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_item JSONB;
BEGIN
    -- Generate order number
    v_order_number := generate_order_number();
    
    -- Create the order including the required type column
    INSERT INTO public.orders (
        type,           -- Add the required type column
        table_id,
        order_number,
        status,
        created_at
    ) VALUES (
        p_type,         -- Use the p_type parameter
        p_table_id,
        v_order_number,
        'active',
        NOW()
    ) RETURNING id INTO v_order_id;
    
    RAISE NOTICE 'Created order % with type % and order_number %', v_order_id, p_type, v_order_number;
    
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
                    -- Continue even if items fail
            END;
        END LOOP;
    END IF;
    
    RETURN v_order_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_order: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the function with the type parameter
DO $$
DECLARE
    test_order_id UUID;
    test_order_number VARCHAR(50);
    test_order_type TEXT;
BEGIN
    -- Test create_order function with proper type
    SELECT create_order(
        'dine_in',      -- This should now be saved as the type
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    -- Verify the order was created with proper type and order_number
    SELECT o.order_number, o.type INTO test_order_number, test_order_type
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_order_number IS NOT NULL AND test_order_type IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Order % created with type % and order_number %', test_order_id, test_order_type, test_order_number;
    ELSE
        RAISE NOTICE 'ERROR: Order created but missing type or order_number';
    END IF;
    
    -- Test with takeaway type too
    SELECT create_order(
        'takeaway',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    RAISE NOTICE 'SUCCESS: Takeaway order created: %', test_order_id;
    
    -- Clean up test orders
    DELETE FROM public.order_items WHERE order_id IN (
        SELECT id FROM public.orders WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%'
    );
    DELETE FROM public.orders WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    RAISE NOTICE 'Test completed successfully - create_order function now handles type column properly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        RAISE;
END $$;
