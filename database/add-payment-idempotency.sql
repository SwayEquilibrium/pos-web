-- Add idempotency to prevent duplicate payments

-- Add idempotency key column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_idempotency 
ON public.payment_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Update record_payment function with idempotency
CREATE OR REPLACE FUNCTION public.record_payment(
    p_idempotency_key VARCHAR(255),
    p_order_id UUID,
    p_payment_type_code VARCHAR(20),
    p_amount DECIMAL(10,2),
    p_reference_number VARCHAR(100) DEFAULT NULL,
    p_processed_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_payment_id UUID;
    v_payment_id TEXT;
    v_payment_type_id UUID;
    v_payment_method VARCHAR(50);
    v_fee_amount DECIMAL(10,2);
    v_net_amount DECIMAL(10,2);
    v_transaction_id UUID;
    v_order_number VARCHAR(50);
BEGIN
    -- Check for existing payment with same idempotency key
    SELECT id INTO v_existing_payment_id 
    FROM public.payment_transactions 
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_payment_id IS NOT NULL THEN
        -- Return existing payment ID (idempotent)
        RETURN v_existing_payment_id;
    END IF;
    
    -- Start explicit transaction
    BEGIN
        -- Generate unique payment ID
        v_payment_id := public.generate_payment_id();
        
        -- Get payment type details
        SELECT id, name, (fee_percentage * p_amount / 100) + fee_fixed
        INTO v_payment_type_id, v_payment_method, v_fee_amount
        FROM public.payment_types
        WHERE code = p_payment_type_code AND active = true;
        
        IF v_payment_type_id IS NULL THEN
            RAISE EXCEPTION 'Invalid payment type code: %', p_payment_type_code;
        END IF;
        
        -- Calculate net amount
        v_net_amount := p_amount - v_fee_amount;
        
        -- Get order number
        SELECT order_number INTO v_order_number
        FROM public.orders
        WHERE id = p_order_id;
        
        -- Insert payment transaction with idempotency key
        INSERT INTO public.payment_transactions (
            idempotency_key,
            payment_id,
            reference_number,
            order_id,
            order_number,
            payment_type_id,
            payment_method,
            amount,
            fee_amount,
            net_amount,
            status,
            processed_by,
            processed_at,
            metadata,
            notes
        ) VALUES (
            p_idempotency_key,
            v_payment_id,
            p_reference_number,
            p_order_id,
            v_order_number,
            v_payment_type_id,
            v_payment_method,
            p_amount,
            v_fee_amount,
            v_net_amount,
            'completed',
            p_processed_by,
            NOW(),
            p_metadata,
            p_notes
        ) RETURNING id INTO v_transaction_id;
        
        -- Update order status to paid
        UPDATE public.orders 
        SET 
            status = 'paid',
            paid_at = NOW(),
            payment_method = v_payment_method,
            updated_at = NOW()
        WHERE id = p_order_id;
        
        COMMIT;
        RETURN v_transaction_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$$;
