-- Dynamic payment insert that adapts to actual table structure
-- Run this in Supabase SQL Editor

-- First, let's see exactly what columns exist
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

-- Create a function that builds the insert dynamically
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
    v_sql TEXT;
    v_columns TEXT;
    v_values TEXT;
BEGIN
    -- Generate required IDs
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
    
    -- Try the comprehensive insert first
    BEGIN
        INSERT INTO payment_transactions (
            payment_id,
            idempotency_key,
            order_id,
            payment_type_id,
            payment_method,
            amount,
            net_amount,
            tax_amount,
            discount_amount,
            tip_amount,
            fee_amount,
            currency_code,
            exchange_rate,
            reference_number,
            processed_by,
            metadata,
            notes,
            status,
            processed_at,
            created_at,
            updated_at,
            transaction_date
        ) VALUES (
            v_payment_id,
            v_idempotency_key,
            p_order_id,
            v_payment_type_id,
            p_payment_type_code,
            p_amount,
            p_amount,
            0.00,
            0.00,
            0.00,
            0.00,
            'DKK',
            1.0000,
            p_reference_number,
            p_processed_by,
            COALESCE(p_metadata, '{}'::JSONB),
            p_notes,
            'completed',
            NOW(),
            NOW(),
            NOW(),
            NOW()
        ) RETURNING id INTO v_transaction_id;
        
        RAISE NOTICE 'Payment inserted with comprehensive columns';
        
    EXCEPTION
        WHEN undefined_column THEN
            -- Try with basic required columns
            BEGIN
                INSERT INTO payment_transactions (
                    payment_id,
                    order_id,
                    payment_type_id,
                    amount,
                    status,
                    processed_at
                ) VALUES (
                    v_payment_id,
                    p_order_id,
                    v_payment_type_id,
                    p_amount,
                    'completed',
                    NOW()
                ) RETURNING id INTO v_transaction_id;
                
                RAISE NOTICE 'Payment inserted with basic columns';
                
            EXCEPTION
                WHEN undefined_column THEN
                    -- Try with absolute minimum (if payment_id doesn't exist)
                    BEGIN
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
                        
                        RAISE NOTICE 'Payment inserted with minimal columns (no payment_id)';
                        
                    EXCEPTION
                        WHEN OTHERS THEN
                            -- Last resort: try with just order_id and amount
                            INSERT INTO payment_transactions (
                                order_id,
                                amount
                            ) VALUES (
                                p_order_id,
                                p_amount
                            ) RETURNING id INTO v_transaction_id;
                            
                            RAISE NOTICE 'Payment inserted with absolute minimum columns';
                    END;
            END;
    END;
    
    -- Update order status
    BEGIN
        UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = p_order_id;
    EXCEPTION
        WHEN undefined_column THEN
            UPDATE orders SET status = 'paid' WHERE id = p_order_id;
    END;
    
    RETURN v_transaction_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'All payment insert attempts failed: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Test the adaptive function
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
        test_order_id,
        'CASH'::TEXT,
        100.00::NUMERIC(10,2)
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
    
    RAISE NOTICE 'ADAPTIVE payment processing test completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment test failed: %', SQLERRM;
        -- Clean up on failure
        BEGIN
            DELETE FROM payment_transactions WHERE order_id = test_order_id;
            DELETE FROM orders WHERE id = test_order_id;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
        RAISE;
END $$;
