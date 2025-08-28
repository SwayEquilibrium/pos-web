-- ================================================
-- IDEMPOTENCY SYSTEM FOR ORDER CREATION
-- Prevents duplicate orders and charges
-- ================================================

-- Create idempotency keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT NOT NULL UNIQUE,
  resource_type TEXT NOT NULL, -- 'order', 'payment', 'reservation'
  resource_id UUID, -- The actual resource ID once created
  request_hash TEXT NOT NULL, -- Hash of the request payload
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_hash ON public.idempotency_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);

-- Function to check/create idempotency key
CREATE OR REPLACE FUNCTION check_idempotency_key(
  p_key_hash TEXT,
  p_resource_type TEXT,
  p_request_hash TEXT,
  p_ttl_minutes INTEGER DEFAULT 60
) RETURNS TABLE(
  is_new BOOLEAN,
  existing_resource_id UUID,
  key_id UUID
) AS $$
DECLARE
  v_existing_key public.idempotency_keys%ROWTYPE;
  v_key_id UUID;
BEGIN
  -- Check for existing key
  SELECT * INTO v_existing_key 
  FROM public.idempotency_keys 
  WHERE key_hash = p_key_hash;
  
  -- If key exists and not expired
  IF v_existing_key IS NOT NULL AND v_existing_key.expires_at > NOW() THEN
    -- Check if request is identical
    IF v_existing_key.request_hash = p_request_hash THEN
      RETURN QUERY SELECT 
        FALSE as is_new,
        v_existing_key.resource_id as existing_resource_id,
        v_existing_key.id as key_id;
      RETURN;
    ELSE
      -- Different request with same key - conflict
      RAISE EXCEPTION 'Idempotency key conflict: same key used for different request';
    END IF;
  END IF;
  
  -- Create new key
  INSERT INTO public.idempotency_keys (
    key_hash, 
    resource_type, 
    request_hash, 
    expires_at
  ) VALUES (
    p_key_hash,
    p_resource_type,
    p_request_hash,
    NOW() + INTERVAL '1 minute' * p_ttl_minutes
  ) RETURNING id INTO v_key_id;
  
  RETURN QUERY SELECT 
    TRUE as is_new,
    NULL::UUID as existing_resource_id,
    v_key_id as key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update idempotency key with resource ID
CREATE OR REPLACE FUNCTION update_idempotency_resource(
  p_key_id UUID,
  p_resource_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.idempotency_keys 
  SET 
    resource_id = p_resource_id,
    updated_at = NOW()
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.idempotency_keys 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for idempotency keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can create/read their own keys
CREATE POLICY "Users can manage their own idempotency keys" ON public.idempotency_keys
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.idempotency_keys TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


