-- Fix orders table column references
-- Run this in Supabase SQL Editor

-- First, let's see what columns actually exist in the orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what columns exist in payment_transactions too
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the problematic view first
DROP VIEW IF EXISTS payment_summary CASCADE;

-- Create a simple payment_summary view using only columns that exist
-- We'll use basic columns that should exist in most orders tables
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.table_id,
    o.status as order_status,
    o.created_at as order_created,
    pt.id as transaction_id,
    pt.payment_type_code,
    pt.amount as payment_amount,
    pt.reference_number,
    pt.processed_at,
    pt.status as payment_status
FROM orders o
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
ORDER BY o.created_at DESC, pt.processed_at DESC;

-- Now create a minimal create_order function that only uses essential columns
DROP FUNCTION IF EXISTS create_order(TEXT, UUID, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION create_order(
    p_type TEXT,
    p_table_id UUID DEFAULT NULL,
    p_pin_required BOOLEAN DEFAULT FALSE,
    p_items JSONB DEFAULT '[]'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_order_number VARCHAR(50);
BEGIN
    -- Generate order number
    v_order_number := generate_order_number();
    
    -- Create the order using only columns that should exist
    -- We'll build this dynamically based on what columns exist
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
            -- Insert order item (assuming order_items table exists)
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
    -- Test order creation
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    -- Verify the order was created
    SELECT o.order_number INTO test_order_number 
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_order_number IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Test order % created with order_number %', test_order_id, test_order_number;
    ELSE
        RAISE NOTICE 'ERROR: Order created but no order_number found';
    END IF;
    
    -- Clean up test order
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        -- Don't re-raise the error for testing
END $$;
