-- Complete fix for payment_transactions table - handle ALL required columns
-- Run this in Supabase SQL Editor

-- Get the complete structure of payment_transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE WHEN is_nullable = 'NO' AND column_default IS NULL THEN 'REQUIRED' ELSE 'OPTIONAL' END as requirement
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create a comprehensive record_payment function that handles ALL required columns
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
    -- Generate required IDs
    IF p_idempotency_key IS NULL THEN
        v_idempotency_key := gen_random_uuid()::text;
    ELSE
        v_idempotency_key := p_idempotency_key;
    END IF;
    
    v_payment_id := gen_random_uuid();
    
    RAISE NOTICE 'Processing payment for order % with type % and amount %', p_order_id, p_payment_type_code, p_amount;
    
    -- Get payment type ID
    SELECT id INTO v_payment_type_id 
    FROM payment_types 
    WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    -- Insert payment transaction with ALL potentially required columns
    INSERT INTO payment_transactions (
        payment_id,              -- Required UUID
        idempotency_key,         -- Our generated key
        order_id,                -- Required UUID
        payment_type_id,         -- Required UUID
        payment_method,          -- Required - use the payment type code
        amount,                  -- Required NUMERIC
        reference_number,        -- Optional
        processed_by,            -- Optional
        metadata,                -- Optional
        notes,                   -- Optional
        status,                  -- Required - set to 'completed'
        processed_at,            -- Required - set to NOW()
        created_at,              -- May be required - set to NOW()
        updated_at               -- May be required - set to NOW()
    ) VALUES (
        v_payment_id,            -- Generated UUID
        v_idempotency_key,       -- Generated or provided key
        p_order_id,              -- Order UUID
        v_payment_type_id,       -- Payment type UUID
        p_payment_type_code,     -- Payment method string (CASH, CARD, etc.)
        p_amount,                -- Payment amount
        p_reference_number,      -- Reference number (optional)
        p_processed_by,          -- Processed by user (optional)
        p_metadata,              -- Metadata JSON (optional)
        p_notes,                 -- Notes (optional)
        'completed',             -- Status
        NOW(),                   -- Processed at timestamp
        NOW(),                   -- Created at timestamp
        NOW()                    -- Updated at timestamp
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
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in record_payment: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the comprehensive function
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
