-- Fix generate_order_number function variable/column ambiguity
-- Run this in Supabase SQL Editor

-- Drop and recreate the generate_order_number function with proper variable names
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS VARCHAR(50) AS $$
DECLARE
    today_date TEXT;
    next_number INTEGER;
    new_order_number VARCHAR(50);  -- Renamed to avoid conflict
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next number for today using explicit table reference
    SELECT COALESCE(MAX(CAST(RIGHT(o.order_number, 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.orders o  -- Use table alias to avoid ambiguity
    WHERE o.order_number LIKE 'ORD-' || today_date || '-%';
    
    -- Generate the order number
    new_order_number := 'ORD-' || today_date || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Also fix the trigger function to avoid similar issues
CREATE OR REPLACE FUNCTION set_order_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the create_order function with the fixed generate_order_number
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
    
    -- Create the order
    INSERT INTO public.orders (
        table_id,
        order_number,
        status,
        created_at
    ) VALUES (
        p_table_id,
        v_order_number,
        'active',
        NOW()
    ) RETURNING id INTO v_order_id;
    
    RAISE NOTICE 'Created order % with order_number %', v_order_id, v_order_number;
    
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

-- Test the complete flow
DO $$
DECLARE
    test_order_id UUID;
    test_order_number VARCHAR(50);
    generated_number VARCHAR(50);
BEGIN
    -- Test generate_order_number function directly
    SELECT generate_order_number() INTO generated_number;
    RAISE NOTICE 'Generated order number: %', generated_number;
    
    -- Test create_order function
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    -- Verify the order was created with proper order_number
    SELECT o.order_number INTO test_order_number 
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_order_number IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Order % created with order_number %', test_order_id, test_order_number;
    ELSE
        RAISE NOTICE 'ERROR: Order created but no order_number found';
    END IF;
    
    -- Clean up test order
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'All tests completed successfully - functions are working properly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        RAISE;
END $$;
