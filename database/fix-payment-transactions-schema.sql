-- Fix payment_transactions table schema issues
-- Run this in Supabase SQL Editor

-- First, let's see the actual structure of payment_transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what constraints exist on the table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'payment_transactions' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, kcu.column_name;

-- Let's see if payment_id is an auto-generated field or needs to be provided
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND column_name = 'payment_id'
AND table_schema = 'public';

-- Update the record_payment function to handle the payment_id column properly
CREATE OR REPLACE FUNCTION record_payment(
    p_order_id UUID,
    p_payment_type_code TEXT,
    p_amount NUMERIC(10,2),
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
    v_payment_id UUID;
BEGIN
    -- Generate idempotency key if not provided
    IF p_idempotency_key IS NULL THEN
        v_idempotency_key := gen_random_uuid()::text;
    ELSE
        v_idempotency_key := p_idempotency_key;
    END IF;
    
    -- Generate payment_id if needed
    v_payment_id := gen_random_uuid();
    
    RAISE NOTICE 'Processing payment for order % with type % and amount %', p_order_id, p_payment_type_code, p_amount;
    
    -- Get payment type ID
    SELECT id INTO v_payment_type_id 
    FROM payment_types 
    WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    RAISE NOTICE 'Found payment type ID: %', v_payment_type_id;
    
    -- Insert payment transaction with payment_id
    BEGIN
        INSERT INTO payment_transactions (
            payment_id,         -- Add the required payment_id
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
            v_payment_id,       -- Generated UUID for payment_id
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
    EXCEPTION
        WHEN undefined_column THEN
            -- If payment_id column doesn't exist, try without it
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
    END;
    
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

-- Test the updated function
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
        test_order_id,          -- UUID
        'CASH'::TEXT,           -- TEXT
        100.00::NUMERIC(10,2)   -- NUMERIC
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
