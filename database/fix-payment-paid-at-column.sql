-- Fix missing paid_at column in orders table
-- Run this in Supabase SQL Editor

-- First, check what columns exist in the orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add paid_at column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'paid_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN paid_at TIMESTAMPTZ NULL;
        
        RAISE NOTICE 'Added paid_at column to orders table';
    ELSE
        RAISE NOTICE 'paid_at column already exists in orders table';
    END IF;
END $$;

-- Check what the record_payment function is trying to do
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'record_payment'
ORDER BY routine_name;

-- Let's also check if we need to update the record_payment function
-- to handle the case where paid_at column might not exist
CREATE OR REPLACE FUNCTION record_payment(
    p_idempotency_key VARCHAR(255) DEFAULT NULL,
    p_order_id UUID,
    p_payment_type_code VARCHAR(50),
    p_amount DECIMAL(10,2),
    p_reference_number VARCHAR(255) DEFAULT NULL,
    p_processed_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_payment_type_id UUID;
    v_idempotency_key VARCHAR(255);
BEGIN
    -- Generate idempotency key if not provided
    IF p_idempotency_key IS NULL THEN
        v_idempotency_key := gen_random_uuid()::text;
    ELSE
        v_idempotency_key := p_idempotency_key;
    END IF;
    
    -- Get payment type ID
    SELECT id INTO v_payment_type_id 
    FROM payment_types 
    WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    -- Insert payment transaction
    INSERT INTO payment_transactions (
        idempotency_key,
        order_id,
        payment_type_id,
        amount,
        reference_number,
        processed_by,
        metadata,
        notes,
        status,
        processed_at
    ) VALUES (
        v_idempotency_key,
        p_order_id,
        v_payment_type_id,
        p_amount,
        p_reference_number,
        p_processed_by,
        p_metadata,
        p_notes,
        'completed',
        NOW()
    ) RETURNING id INTO v_transaction_id;
    
    -- Update order status and paid_at (if column exists)
    BEGIN
        UPDATE orders 
        SET 
            status = 'paid',
            paid_at = NOW()
        WHERE id = p_order_id;
    EXCEPTION
        WHEN undefined_column THEN
            -- If paid_at column doesn't exist, just update status
            UPDATE orders 
            SET status = 'paid'
            WHERE id = p_order_id;
            
            RAISE NOTICE 'Updated order status to paid (paid_at column not available)';
    END;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Test the payment function
DO $$
DECLARE
    test_order_id UUID;
    test_payment_id UUID;
    test_status TEXT;
    test_paid_at TIMESTAMPTZ;
BEGIN
    -- Create a test order
    SELECT create_order('dine_in', NULL, FALSE, '[]'::JSONB) INTO test_order_id;
    RAISE NOTICE 'Created test order: %', test_order_id;
    
    -- Test payment processing
    SELECT record_payment(
        NULL,           -- idempotency_key
        test_order_id,  -- order_id
        'CASH',         -- payment_type_code
        100.00,         -- amount
        NULL,           -- reference_number
        NULL,           -- processed_by
        '{"test": true}'::JSONB,  -- metadata
        'Test payment'  -- notes
    ) INTO test_payment_id;
    
    RAISE NOTICE 'Payment recorded with ID: %', test_payment_id;
    
    -- Check if order was updated
    SELECT o.status, o.paid_at INTO test_status, test_paid_at
    FROM orders o 
    WHERE o.id = test_order_id;
    
    RAISE NOTICE 'Order status: %, paid_at: %', test_status, test_paid_at;
    
    -- Clean up test data
    DELETE FROM payment_transactions WHERE id = test_payment_id;
    DELETE FROM orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Payment processing test completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment test failed: %', SQLERRM;
        -- Clean up on failure
        DELETE FROM payment_transactions WHERE order_id = test_order_id;
        DELETE FROM orders WHERE id = test_order_id;
        RAISE;
END $$;
