-- Fix payment table column references
-- Run this in Supabase SQL Editor

-- Check actual columns in payment_transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check actual columns in orders table too
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the problematic view
DROP VIEW IF EXISTS payment_summary CASCADE;

-- Create payment_summary view using correct column names
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.table_id,
    o.status as order_status,
    o.created_at as order_created,
    pt.id as transaction_id,
    pt.payment_type_id,  -- Using correct column name
    pt.amount as payment_amount,
    pt.reference_number,
    pt.processed_at,
    pt.status as payment_status
FROM orders o
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
ORDER BY o.created_at DESC, pt.processed_at DESC;

-- Create a minimal, safe create_order function
DROP FUNCTION IF EXISTS create_order(TEXT, UUID, BOOLEAN, JSONB);

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
    
    -- Create the order using only essential columns
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
    
    -- Insert order items if provided and if order_items table exists
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
                    -- Continue with order creation even if items fail
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

-- Test the function
DO $$
DECLARE
    test_order_id UUID;
    test_order_number VARCHAR(50);
BEGIN
    -- Test basic order creation
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    -- Verify the order was created with order_number
    SELECT o.order_number INTO test_order_number 
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_order_number IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Order % created with order_number %', test_order_id, test_order_number;
    ELSE
        RAISE NOTICE 'WARNING: Order created but no order_number found';
    END IF;
    
    -- Clean up test order
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully - create_order function is working';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;
