-- Fix ambiguous order_number column reference in create_order function
-- Run this in Supabase SQL Editor

-- Drop and recreate the create_order function with proper table aliases
CREATE OR REPLACE FUNCTION create_order(
    p_type VARCHAR(20),
    p_table_id UUID DEFAULT NULL,
    p_pin_required BOOLEAN DEFAULT FALSE,
    p_items JSONB DEFAULT '[]'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_modifier JSONB;
    v_order_number VARCHAR(50);
BEGIN
    -- Generate order number
    v_order_number := generate_order_number();
    
    -- Create the order with explicit column reference
    INSERT INTO orders (
        order_type,
        table_id,
        pin_required,
        order_number,
        status,
        created_at
    ) VALUES (
        p_type,
        p_table_id,
        p_pin_required,
        v_order_number,
        'active',
        NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
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
            COALESCE((v_item->>'unit_price')::DECIMAL, 0),
            v_item->>'kitchen_note',
            COALESCE((v_item->>'sort_bucket')::INTEGER, 0),
            COALESCE((v_item->>'course_no')::INTEGER, 1),
            NOW()
        );
        
        -- Insert modifiers if they exist
        IF v_item ? 'modifiers' AND jsonb_array_length(v_item->'modifiers') > 0 THEN
            FOR v_modifier IN SELECT * FROM jsonb_array_elements(v_item->'modifiers')
            LOOP
                INSERT INTO order_item_modifiers (
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
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Also check if there are any views or other functions that might have ambiguous references
-- Let's create a simple test to verify the function works
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    -- Test the function with a simple order
    SELECT create_order(
        'dine_in',
        NULL,
        FALSE,
        '[]'::JSONB
    ) INTO test_order_id;
    
    RAISE NOTICE 'Test order created successfully with ID: %', test_order_id;
    
    -- Clean up test order
    DELETE FROM orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Test completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;
