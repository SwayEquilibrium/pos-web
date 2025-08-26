-- SIMPLE approach: Show exact table structure and create working function
-- Run this in Supabase SQL Editor

-- Step 1: Show EXACTLY what your payment_transactions table looks like
SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Create a simple function that includes payment_method in basic insert
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
    IF p_idempotency_key IS NULL THEN
        v_idempotency_key := gen_random_uuid()::text;
    ELSE
        v_idempotency_key := p_idempotency_key;
    END IF;
    
    v_payment_id := gen_random_uuid();
    
    SELECT id INTO v_payment_type_id FROM payment_types WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    -- Simple insert with the columns we know are required
    INSERT INTO payment_transactions (
        payment_id,
        order_id,
        payment_type_id,
        payment_method,        -- This is required!
        amount,
        status,
        processed_at
    ) VALUES (
        v_payment_id,
        p_order_id,
        v_payment_type_id,
        p_payment_type_code,   -- Use the payment type code as payment_method
        p_amount,
        'completed',
        NOW()
    ) RETURNING id INTO v_transaction_id;
    
    -- Update order status
    BEGIN
        UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = p_order_id;
    EXCEPTION
        WHEN undefined_column THEN
            UPDATE orders SET status = 'paid' WHERE id = p_order_id;
    END;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Test it
DO $$
DECLARE test_order_id UUID; test_payment_id UUID;
BEGIN
    SELECT create_order('dine_in', NULL, FALSE, '[]'::JSONB) INTO test_order_id;
    RAISE NOTICE 'Created order: %', test_order_id;
    
    SELECT record_payment(test_order_id, 'CASH'::TEXT, 100.00::NUMERIC(10,2)) INTO test_payment_id;
    RAISE NOTICE 'SUCCESS: Payment ID %', test_payment_id;
    
    -- Check what was actually inserted
    SELECT 
        payment_id,
        order_id, 
        payment_method,
        amount,
        status
    FROM payment_transactions 
    WHERE id = test_payment_id;
    
    DELETE FROM payment_transactions WHERE id = test_payment_id;
    DELETE FROM orders WHERE id = test_order_id;
    RAISE NOTICE 'SIMPLE test completed successfully!';
END $$;
