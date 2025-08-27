-- Idempotency System v1.0
-- Prevents duplicate operations with automatic cleanup

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL, -- References companies(id)
  key varchar(255) NOT NULL,
  operation varchar(50) NOT NULL,
  resource_id uuid,
  response_data jsonb,
  status varchar(20) NOT NULL DEFAULT 'processing' 
    CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  
  UNIQUE(tenant_id, key, operation)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON public.idempotency_keys(tenant_id, key, operation);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status 
ON public.idempotency_keys(status, created_at);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_cleanup 
ON public.idempotency_keys(expires_at) 
WHERE status IN ('completed', 'failed');

-- Helper function for idempotent operations
CREATE OR REPLACE FUNCTION public.ensure_idempotent_operation(
  p_tenant_id uuid,
  p_key varchar(255),
  p_operation varchar(50)
) RETURNS TABLE (
  exists boolean,
  resource_id uuid,
  response_data jsonb,
  status varchar(20)
) LANGUAGE plpgsql AS $$
DECLARE
  v_record record;
BEGIN
  -- Try to claim the operation
  BEGIN
    INSERT INTO public.idempotency_keys (tenant_id, key, operation, status)
    VALUES (p_tenant_id, p_key, p_operation, 'processing');
    
    -- Operation claimed successfully
    RETURN QUERY SELECT false, null::uuid, null::jsonb, 'processing'::varchar(20);
    RETURN;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Operation already exists, check its status
      SELECT ik.resource_id, ik.response_data, ik.status
      INTO v_record
      FROM public.idempotency_keys ik
      WHERE ik.tenant_id = p_tenant_id 
        AND ik.key = p_key 
        AND ik.operation = p_operation
        AND ik.expires_at > now();
      
      IF FOUND THEN
        RETURN QUERY SELECT true, v_record.resource_id, v_record.response_data, v_record.status;
      ELSE
        -- Expired key, try to claim again
        DELETE FROM public.idempotency_keys 
        WHERE tenant_id = p_tenant_id AND key = p_key AND operation = p_operation;
        
        INSERT INTO public.idempotency_keys (tenant_id, key, operation, status)
        VALUES (p_tenant_id, p_key, p_operation, 'processing');
        
        RETURN QUERY SELECT false, null::uuid, null::jsonb, 'processing'::varchar(20);
      END IF;
  END;
END;
$$;

-- Function to complete idempotent operation
CREATE OR REPLACE FUNCTION public.complete_idempotent_operation(
  p_tenant_id uuid,
  p_key varchar(255),
  p_operation varchar(50),
  p_resource_id uuid,
  p_response_data jsonb,
  p_status varchar(20) DEFAULT 'completed'
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.idempotency_keys 
  SET 
    resource_id = p_resource_id,
    response_data = p_response_data,
    status = p_status
  WHERE tenant_id = p_tenant_id 
    AND key = p_key 
    AND operation = p_operation;
END;
$$;

-- Cleanup function for expired keys
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < now() 
    AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also clean up very old processing keys (stuck operations)
  DELETE FROM public.idempotency_keys 
  WHERE created_at < (now() - interval '1 hour')
    AND status = 'processing';
  
  RETURN deleted_count;
END;
$$;

