-- Clean up ALL record_payment functions and create single version
-- Run this in Supabase SQL Editor

-- Drop ALL existing record_payment functions
DROP FUNCTION IF EXISTS record_payment(VARCHAR, UUID, VARCHAR, NUMERIC, VARCHAR, UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_payment(TEXT, UUID, TEXT, NUMERIC, TEXT, UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, TEXT, NUMERIC, TEXT, TEXT, UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_payment(UUID, VARCHAR, NUMERIC, VARCHAR, VARCHAR, UUID, JSONB, TEXT) CASCADE;

-- Verify all functions are gone
SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'record_payment';

-- Create SINGLE record_payment function that matches the application's call
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
    
    v_payment_id := gen_random_uuid();
    
    -- Get payment type ID
    SELECT id INTO v_payment_type_id FROM payment_types WHERE code = p_payment_type_code;
    
    IF v_payment_type_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
    END IF;
    
    -- Insert payment with all required columns
    INSERT INTO payment_transactions (
        payment_id,
        order_id,
        payment_type_id,
        payment_method,
        amount,
        net_amount,
        status,
        processed_at
    ) VALUES (
        v_payment_id,
        p_order_id,
        v_payment_type_id,
        p_payment_type_code,
        p_amount,
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

-- Verify only one function exists now
SELECT 
    routine_name,
    routine_type,
    specific_name,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'record_payment';

-- Test the single function
DO $$
DECLARE test_order_id UUID; test_payment_id UUID;
BEGIN
    SELECT create_order('dine_in', NULL, FALSE, '[]'::JSONB) INTO test_order_id;
    
    -- Test with parameter names (like the application uses)
    SELECT record_payment(
        p_order_id => test_order_id,
        p_payment_type_code => 'CASH'::TEXT,
        p_amount => 100.00::NUMERIC(10,2)
    ) INTO test_payment_id;
    
    RAISE NOTICE 'SUCCESS: Single function works with ID %', test_payment_id;
    
    DELETE FROM payment_transactions WHERE id = test_payment_id;
    DELETE FROM orders WHERE id = test_order_id;
    RAISE NOTICE 'Function ambiguity resolved!';
END $$;
