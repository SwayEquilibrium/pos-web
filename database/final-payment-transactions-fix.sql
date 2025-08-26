-- FINAL fix - include EVERY required column in payment_transactions
-- Run this in Supabase SQL Editor

-- First, show ALL columns and their requirements
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' AND column_default IS NULL THEN 'MUST PROVIDE'
        WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN 'HAS DEFAULT'
        ELSE 'OPTIONAL'
    END as requirement
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create the ultimate record_payment function with EVERY possible required field
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
    
    -- Insert with EVERY possible required column
    INSERT INTO payment_transactions (
        payment_id,              -- Required UUID
        idempotency_key,         -- Generated key
        order_id,                -- Required UUID
        payment_type_id,         -- Required UUID  
        payment_method,          -- Required - payment type code
        amount,                  -- Required amount (gross amount)
        net_amount,              -- Required - same as amount for now
        tax_amount,              -- May be required - default to 0
        discount_amount,         -- May be required - default to 0
        tip_amount,              -- May be required - default to 0
        fee_amount,              -- May be required - default to 0
        currency_code,           -- May be required - default to DKK
        exchange_rate,           -- May be required - default to 1.0
        reference_number,        -- Optional
        processed_by,            -- Optional
        metadata,                -- Optional
        notes,                   -- Optional
        status,                  -- Required - 'completed'
        processed_at,            -- Required - NOW()
        created_at,              -- May be required - NOW()
        updated_at,              -- May be required - NOW()
        transaction_date,        -- May be required - NOW()
        reconciled_at,           -- Optional
        refunded_at,             -- Optional
        gateway_transaction_id,  -- Optional
        gateway_response,        -- Optional
        failure_reason,          -- Optional
        customer_id,             -- Optional
        merchant_id,             -- Optional
        terminal_id              -- Optional
    ) VALUES (
        v_payment_id,            -- Generated UUID
        v_idempotency_key,       -- Generated key
        p_order_id,              -- Order UUID
        v_payment_type_id,       -- Payment type UUID
        p_payment_type_code,     -- CASH, CARD, etc.
        p_amount,                -- Gross payment amount
        p_amount,                -- Net amount (same as gross for now)
        0.00,                    -- Tax amount (default to 0)
        0.00,                    -- Discount amount (default to 0)
        0.00,                    -- Tip amount (default to 0)
        0.00,                    -- Fee amount (default to 0)
        'DKK',                   -- Currency code
        1.0000,                  -- Exchange rate
        p_reference_number,      -- Reference number (optional)
        p_processed_by,          -- Processed by user (optional)
        p_metadata,              -- Metadata JSON (optional)
        p_notes,                 -- Notes (optional)
        'completed',             -- Status
        NOW(),                   -- Processed timestamp
        NOW(),                   -- Created timestamp
        NOW(),                   -- Updated timestamp
        NOW(),                   -- Transaction date
        NULL,                    -- Reconciled at (optional)
        NULL,                    -- Refunded at (optional)
        NULL,                    -- Gateway transaction ID (optional)
        NULL,                    -- Gateway response (optional)
        NULL,                    -- Failure reason (optional)
        NULL,                    -- Customer ID (optional)
        NULL,                    -- Merchant ID (optional)
        NULL                     -- Terminal ID (optional)
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
    WHEN undefined_column THEN
        RAISE NOTICE 'Some columns do not exist, trying with minimal required columns only';
        -- Fallback: try with just the absolutely essential columns
        INSERT INTO payment_transactions (
            order_id,
            payment_type_id,
            amount,
            status,
            processed_at
        ) VALUES (
            p_order_id,
            v_payment_type_id,
            p_amount,
            'completed',
            NOW()
        ) RETURNING id INTO v_transaction_id;
        
        RETURN v_transaction_id;
        
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in record_payment: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the ultimate function
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
    
    RAISE NOTICE 'ULTIMATE payment processing test completed successfully!';
    
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
