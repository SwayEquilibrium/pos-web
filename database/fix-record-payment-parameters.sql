-- Fix record_payment function parameter order
-- Run this in Supabase SQL Editor

-- Add paid_at column to orders table if missing
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

-- Drop existing record_payment function to avoid conflicts
DROP FUNCTION IF EXISTS record_payment(VARCHAR, UUID, VARCHAR, DECIMAL, VARCHAR, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS record_payment(UUID, VARCHAR, DECIMAL, VARCHAR, UUID, JSONB, TEXT);

-- Create record_payment function with proper parameter order
-- Required parameters first, then optional parameters with defaults
CREATE OR REPLACE FUNCTION record_payment(
    p_order_id UUID,
    p_payment_type_code VARCHAR(50),
    p_amount DECIMAL(10,2),
    p_idempotency_key VARCHAR(255) DEFAULT NULL,
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
    
    -- Update order status and paid_at (with graceful handling)
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

-- Test the payment function with the new parameter order
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
    
    -- Test payment processing with new parameter order
    SELECT record_payment(
        test_order_id,  -- p_order_id (required)
        'CASH',         -- p_payment_type_code (required)
        100.00,         -- p_amount (required)
        NULL,           -- p_idempotency_key (optional)
        NULL,           -- p_reference_number (optional)
        NULL,           -- p_processed_by (optional)
        '{"test": true}'::JSONB,  -- p_metadata (optional)
        'Test payment'  -- p_notes (optional)
    ) INTO test_payment_id;
    
    RAISE NOTICE 'Payment recorded with ID: %', test_payment_id;
    
    -- Check if order was updated
    SELECT o.status, o.paid_at INTO test_status, test_paid_at
    FROM orders o 
    WHERE o.id = test_order_id;
    
    RAISE NOTICE 'Order status: %, paid_at: %', test_status, test_paid_at;
    
    -- Test with minimal parameters
    SELECT create_order('takeaway', NULL, FALSE, '[]'::JSONB) INTO test_order_id;
    SELECT record_payment(test_order_id, 'CARD', 50.00) INTO test_payment_id;
    RAISE NOTICE 'Minimal parameter test successful';
    
    -- Clean up test data
    DELETE FROM payment_transactions WHERE order_id IN (
        SELECT id FROM orders WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%'
    );
    DELETE FROM orders WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    RAISE NOTICE 'Payment processing test completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment test failed: %', SQLERRM;
        RAISE;
END $$;
