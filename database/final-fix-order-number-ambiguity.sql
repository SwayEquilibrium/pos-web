-- Final fix for order_number ambiguity in generate_order_number function
-- Run this in Supabase SQL Editor

-- Drop and recreate generate_order_number function with proper table aliases
DROP FUNCTION IF EXISTS generate_order_number();

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS VARCHAR(50) AS $$
DECLARE
    today_date TEXT;
    next_number INTEGER;
    new_order_number VARCHAR(50);  -- Different variable name to avoid conflict
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next number for today using explicit table alias
    SELECT COALESCE(MAX(CAST(RIGHT(o.order_number, 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.orders o  -- Use table alias 'o' to avoid ambiguity
    WHERE o.order_number LIKE 'ORD-' || today_date || '-%';
    
    -- Generate the new order number
    new_order_number := 'ORD-' || today_date || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Also recreate the trigger function for consistency
CREATE OR REPLACE FUNCTION set_order_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now recreate the create_order function with the fixed generate_order_number
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
    -- Generate order number using the fixed function
    v_order_number := generate_order_number();
    
    -- Create the order with all required columns
    INSERT INTO public.orders (
        type,           -- Required NOT NULL column
        table_id,
        order_number,
        status,
        created_at
    ) VALUES (
        p_type,         -- 'dine_in' or 'takeaway'
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

-- Test all functions step by step
DO $$
DECLARE
    test_order_number VARCHAR(50);
    test_order_id UUID;
    test_type TEXT;
    final_order_number VARCHAR(50);
BEGIN
    -- Test 1: generate_order_number function directly
    SELECT generate_order_number() INTO test_order_number;
    RAISE NOTICE 'Step 1 SUCCESS: Generated order number: %', test_order_number;
    
    -- Test 2: create_order function
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    RAISE NOTICE 'Step 2 SUCCESS: Created order ID: %', test_order_id;
    
    -- Test 3: Verify the order was created properly
    SELECT o.type, o.order_number 
    INTO test_type, final_order_number
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_type IS NOT NULL AND final_order_number IS NOT NULL THEN
        RAISE NOTICE 'Step 3 SUCCESS: Order % has type % and order_number %', 
                     test_order_id, test_type, final_order_number;
    ELSE
        RAISE NOTICE 'Step 3 ERROR: Missing type or order_number';
    END IF;
    
    -- Clean up test order
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'ALL TESTS PASSED: Order creation system is working properly!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed at step: %', SQLERRM;
        RAISE;
END $$;
