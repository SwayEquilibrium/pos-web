-- Clean up all record_payment functions and create a single version
-- Run this in Supabase SQL Editor

-- Add paid_at column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'paid_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMPTZ NULL;
        RAISE NOTICE 'Added paid_at column to orders table';
    ELSE
        RAISE NOTICE 'paid_at column already exists';
    END IF;
END $$;

-- Drop ALL existing record_payment functions to avoid conflicts
DROP FUNCTION IF EXISTS record_payment(VARCHAR, UUID, VARCHAR, DECIMAL, VARCHAR, UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, VARCHAR, DECIMAL, VARCHAR, UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, VARCHAR, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, VARCHAR, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, UNKNOWN, NUMERIC) CASCADE;

-- Show what functions still exist (should be empty)
SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'record_payment';

-- Create a single, clean record_payment function
CREATE OR REPLACE FUNCTION record_payment(
    p_order_id UUID,
    p_payment_type_code TEXT,  -- Using TEXT instead of VARCHAR for flexibility
    p_amount NUMERIC(10,2),    -- Using NUMERIC instead of DECIMAL
    p_idempotency_key TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_processed_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_payment_type_id UUID;
    v_idempotency_key TEXT;
BEGIN
    -- Generate idempotency key if not provided
    IF p_idempotency_key IS NULL THEN
        v_idempotency_key := gen_random_uuid()::text;
    ELSE
        v_idempotency_key := p_idempotency_key;
    END IF;
    
    RAISE NOTICE 'Processing payment for order % with type % and amount %', p_order_id, p_payment_type_code, p_amount;
    
    -- Get payment type ID
    SELECT id INTO v_payment_type_id 
    FROM payment_types 
    WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    RAISE NOTICE 'Found payment type ID: %', v_payment_type_id;
    
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
    
    RAISE NOTICE 'Created payment transaction: %', v_transaction_id;
    
    -- Update order status and paid_at
    BEGIN
        UPDATE orders 
        SET 
            status = 'paid',
            paid_at = NOW()
        WHERE id = p_order_id;
        
        RAISE NOTICE 'Updated order status to paid';
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

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    specific_name,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'record_payment';

-- Test the function with explicit type casting
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
    
    -- Test payment processing with explicit type casting
    SELECT record_payment(
        test_order_id,          -- UUID
        'CASH'::TEXT,           -- TEXT (explicit cast)
        100.00::NUMERIC(10,2)   -- NUMERIC (explicit cast)
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
        BEGIN
            DELETE FROM payment_transactions WHERE order_id = test_order_id;
            DELETE FROM orders WHERE id = test_order_id;
        EXCEPTION
            WHEN OTHERS THEN
                NULL; -- Ignore cleanup errors
        END;
        RAISE;
END $$;
