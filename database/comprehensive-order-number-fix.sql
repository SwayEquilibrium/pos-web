-- Comprehensive fix for persistent order_number ambiguity
-- Run this in Supabase SQL Editor

-- First, let's see what tables have order_number columns
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'order_number'
AND table_schema = 'public'
ORDER BY table_name;

-- Check for any views that might be causing issues
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
AND definition ILIKE '%order_number%';

-- Check for functions that reference order_number
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%order_number%';

-- Drop any problematic views first
DROP VIEW IF EXISTS payment_summary CASCADE;

-- Recreate payment_summary view with proper table aliases
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    o.id as order_id,
    o.order_number as order_number,
    o.order_type,
    o.table_id,
    o.status as order_status,
    o.created_at as order_created,
    pt.id as transaction_id,
    pt.payment_type_code,
    pt.amount as payment_amount,
    pt.reference_number,
    pt.processed_at,
    pt.processed_by,
    pt.status as payment_status
FROM orders o
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
ORDER BY o.created_at DESC, pt.processed_at DESC;

-- Now let's completely recreate the create_order function with explicit table references
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
    v_modifier JSONB;
    v_order_number VARCHAR(50);
    v_product_price DECIMAL;
BEGIN
    -- Generate order number using our function
    v_order_number := generate_order_number();
    
    -- Create the order with explicit table reference
    INSERT INTO public.orders (
        order_type,
        table_id,
        pin_required,
        order_number,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_type,
        p_table_id,
        p_pin_required,
        v_order_number,
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Log the order creation
    RAISE NOTICE 'Created order % with order_number %', v_order_id, v_order_number;
    
    -- Insert order items if provided
    IF jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Get product price if not provided
            IF v_item->>'unit_price' IS NULL OR (v_item->>'unit_price')::DECIMAL = 0 THEN
                SELECT price INTO v_product_price 
                FROM public.products 
                WHERE id = (v_item->>'product_id')::UUID;
            ELSE
                v_product_price := (v_item->>'unit_price')::DECIMAL;
            END IF;
            
            -- Insert order item with explicit table reference
            INSERT INTO public.order_items (
                order_id,
                product_id,
                qty,
                unit_price,
                kitchen_note,
                sort_bucket,
                course_no,
                created_at
            ) VALUES (
                v_order_id,
                (v_item->>'product_id')::UUID,
                (v_item->>'qty')::INTEGER,
                COALESCE(v_product_price, 0),
                v_item->>'kitchen_note',
                COALESCE((v_item->>'sort_bucket')::INTEGER, 0),
                COALESCE((v_item->>'course_no')::INTEGER, 1),
                NOW()
            );
            
            -- Insert modifiers if they exist
            IF v_item ? 'modifiers' AND jsonb_array_length(v_item->'modifiers') > 0 THEN
                FOR v_modifier IN SELECT * FROM jsonb_array_elements(v_item->'modifiers')
                LOOP
                    INSERT INTO public.order_item_modifiers (
                        order_id,
                        product_id,
                        modifier_id,
                        modifier_name,
                        price_adjustment,
                        created_at
                    ) VALUES (
                        v_order_id,
                        (v_item->>'product_id')::UUID,
                        (v_modifier->>'modifier_id')::UUID,
                        v_modifier->>'modifier_name',
                        COALESCE((v_modifier->>'price_adjustment')::DECIMAL, 0),
                        NOW()
                    );
                END LOOP;
            END IF;
        END LOOP;
    END IF;
    
    RETURN v_order_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_order: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the function thoroughly
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
    
    -- Verify the order was created properly
    SELECT o.order_number INTO test_order_number 
    FROM public.orders o 
    WHERE o.id = test_order_id;
    
    IF test_order_number IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Test order % created with order_number %', test_order_id, test_order_number;
    ELSE
        RAISE NOTICE 'ERROR: Order created but no order_number assigned';
    END IF;
    
    -- Test with items
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[{"product_id": "' || gen_random_uuid() || '", "qty": 1}]'::JSONB
    ) INTO test_order_id;
    
    RAISE NOTICE 'SUCCESS: Test order with items created: %', test_order_id;
    
    -- Clean up test orders
    DELETE FROM public.order_items WHERE order_id IN (
        SELECT id FROM public.orders WHERE id IN (test_order_id)
    );
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully - create_order function is working properly';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
        RAISE;
END $$;
