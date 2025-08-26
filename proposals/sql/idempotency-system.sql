-- Idempotency System v1.0
-- Prevents duplicate operations across all critical endpoints

CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  key varchar(255) NOT NULL,
  operation varchar(50) NOT NULL,
  resource_id uuid,
  response_data jsonb,
  status varchar(20) NOT NULL DEFAULT 'processing' 
    CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  
  UNIQUE(company_id, key, operation)
);

CREATE INDEX idx_idempotency_keys_lookup 
ON public.idempotency_keys(company_id, key, operation);

CREATE INDEX idx_idempotency_keys_cleanup 
ON public.idempotency_keys(expires_at) WHERE status != 'processing';

-- Idempotent order creation
CREATE OR REPLACE FUNCTION create_order_idempotent(
  p_idempotency_key varchar(255),
  p_type text,
  p_table_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id uuid;
  v_existing_result jsonb;
  v_order_id uuid;
  v_result jsonb;
BEGIN
  -- Get company for current user
  SELECT company_id INTO v_company_id 
  FROM public.user_profiles WHERE id = auth.uid();
  
  -- Check for existing completed operation
  SELECT response_data INTO v_existing_result
  FROM public.idempotency_keys 
  WHERE company_id = v_company_id 
    AND key = p_idempotency_key 
    AND operation = 'create_order'
    AND status = 'completed'
    AND expires_at > now();
    
  IF v_existing_result IS NOT NULL THEN
    RETURN v_existing_result;
  END IF;
  
  BEGIN
    -- Claim operation
    INSERT INTO public.idempotency_keys (
      company_id, key, operation, status
    ) VALUES (
      v_company_id, p_idempotency_key, 'create_order', 'processing'
    );
    
    -- Create order
    SELECT create_order(p_type, p_table_id, false, p_items) INTO v_order_id;
    
    -- Prepare response
    v_result := jsonb_build_object('order_id', v_order_id, 'status', 'created');
    
    -- Mark completed
    UPDATE public.idempotency_keys 
    SET resource_id = v_order_id, response_data = v_result, status = 'completed'
    WHERE company_id = v_company_id AND key = p_idempotency_key;
    
    RETURN v_result;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Retry after brief wait
      PERFORM pg_sleep(0.1);
      RETURN create_order_idempotent(p_idempotency_key, p_type, p_table_id, p_items);
    WHEN OTHERS THEN
      UPDATE public.idempotency_keys SET status = 'failed' 
      WHERE company_id = v_company_id AND key = p_idempotency_key;
      RAISE;
  END;
END;
$$;

-- Idempotent payment processing
CREATE OR REPLACE FUNCTION record_payment_idempotent(
  p_idempotency_key varchar(255),
  p_order_id uuid,
  p_payment_type_code varchar(20),
  p_amount integer, -- Minor units (øre)
  p_reference_number varchar(100) DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id uuid;
  v_existing_result jsonb;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Get company for current user
  SELECT company_id INTO v_company_id 
  FROM public.user_profiles WHERE id = auth.uid();
  
  -- Check for existing completed operation
  SELECT response_data INTO v_existing_result
  FROM public.idempotency_keys 
  WHERE company_id = v_company_id 
    AND key = p_idempotency_key 
    AND operation = 'record_payment'
    AND status = 'completed'
    AND expires_at > now();
    
  IF v_existing_result IS NOT NULL THEN
    RETURN v_existing_result;
  END IF;
  
  BEGIN
    -- Claim operation
    INSERT INTO public.idempotency_keys (
      company_id, key, operation, status
    ) VALUES (
      v_company_id, p_idempotency_key, 'record_payment', 'processing'
    );
    
    -- Process payment (assuming existing record_payment function)
    SELECT record_payment(
      p_order_id, p_payment_type_code, p_amount::numeric/100, 
      p_idempotency_key, p_reference_number
    ) INTO v_transaction_id;
    
    -- Prepare response
    v_result := jsonb_build_object(
      'transaction_id', v_transaction_id, 
      'status', 'completed',
      'amount', p_amount
    );
    
    -- Mark completed
    UPDATE public.idempotency_keys 
    SET resource_id = v_transaction_id, response_data = v_result, status = 'completed'
    WHERE company_id = v_company_id AND key = p_idempotency_key;
    
    RETURN v_result;
    
  EXCEPTION
    WHEN unique_violation THEN
      PERFORM pg_sleep(0.1);
      RETURN record_payment_idempotent(p_idempotency_key, p_order_id, p_payment_type_code, p_amount, p_reference_number);
    WHEN OTHERS THEN
      UPDATE public.idempotency_keys SET status = 'failed' 
      WHERE company_id = v_company_id AND key = p_idempotency_key;
      RAISE;
  END;
END;
$$;

-- Cleanup expired keys (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < now() AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- RLS policies
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolated idempotency keys" ON public.idempotency_keys FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);
