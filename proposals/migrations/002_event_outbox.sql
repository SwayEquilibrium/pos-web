-- Event Outbox System v1.0
-- Reliable event delivery with retry logic and dead letter queue

CREATE TABLE IF NOT EXISTS public.event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL, -- References companies(id)
  location_id uuid, -- Optional location filtering
  
  -- Event identification
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  event_version varchar(10) NOT NULL DEFAULT '1.0',
  
  -- Event data
  event_data jsonb NOT NULL,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  causation_id uuid, -- ID of event that caused this one
  
  -- Timing
  occurred_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  
  -- Delivery tracking
  delivered_at timestamptz,
  delivery_attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  
  -- Error handling
  last_error text,
  error_count integer NOT NULL DEFAULT 0,
  dead_letter boolean NOT NULL DEFAULT false,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient processing
CREATE INDEX IF NOT EXISTS idx_event_outbox_processing 
ON public.event_outbox(tenant_id, delivered_at, next_retry_at, scheduled_for)
WHERE delivered_at IS NULL AND dead_letter = false;

CREATE INDEX IF NOT EXISTS idx_event_outbox_correlation 
ON public.event_outbox(correlation_id);

CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate 
ON public.event_outbox(tenant_id, aggregate_type, aggregate_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_outbox_event_type 
ON public.event_outbox(tenant_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_outbox_cleanup 
ON public.event_outbox(delivered_at, created_at)
WHERE delivered_at IS NOT NULL;

-- Function to emit domain events
CREATE OR REPLACE FUNCTION public.emit_domain_event(
  p_tenant_id uuid,
  p_aggregate_type varchar(50),
  p_aggregate_id uuid,
  p_event_type varchar(100),
  p_event_data jsonb,
  p_correlation_id uuid DEFAULT gen_random_uuid(),
  p_causation_id uuid DEFAULT NULL,
  p_location_id uuid DEFAULT NULL,
  p_scheduled_for timestamptz DEFAULT now()
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.event_outbox (
    tenant_id,
    location_id,
    aggregate_type,
    aggregate_id,
    event_type,
    event_data,
    correlation_id,
    causation_id,
    scheduled_for
  ) VALUES (
    p_tenant_id,
    p_location_id,
    p_aggregate_type,
    p_aggregate_id,
    p_event_type,
    p_event_data,
    p_correlation_id,
    p_causation_id,
    p_scheduled_for
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to get unprocessed events for delivery
CREATE OR REPLACE FUNCTION public.get_unprocessed_events(
  p_tenant_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
) RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  location_id uuid,
  aggregate_type varchar,
  aggregate_id uuid,
  event_type varchar,
  event_version varchar,
  event_data jsonb,
  correlation_id uuid,
  causation_id uuid,
  occurred_at timestamptz,
  delivery_attempts integer,
  last_error text
) LANGUAGE sql AS $$
  SELECT 
    e.id,
    e.tenant_id,
    e.location_id,
    e.aggregate_type,
    e.aggregate_id,
    e.event_type,
    e.event_version,
    e.event_data,
    e.correlation_id,
    e.causation_id,
    e.occurred_at,
    e.delivery_attempts,
    e.last_error
  FROM public.event_outbox e
  WHERE e.delivered_at IS NULL
    AND e.dead_letter = false
    AND (e.next_retry_at IS NULL OR e.next_retry_at <= now())
    AND e.scheduled_for <= now()
    AND (p_tenant_id IS NULL OR e.tenant_id = p_tenant_id)
    AND e.delivery_attempts < e.max_attempts
  ORDER BY e.occurred_at, e.created_at
  LIMIT p_limit;
$$;

-- Function to mark event as delivered
CREATE OR REPLACE FUNCTION public.mark_event_delivered(p_event_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.event_outbox 
  SET 
    delivered_at = now(),
    last_error = NULL
  WHERE id = p_event_id;
END;
$$;

-- Function to mark event delivery failed
CREATE OR REPLACE FUNCTION public.mark_event_failed(
  p_event_id uuid, 
  p_error_message text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_attempts integer;
  v_max_attempts integer;
BEGIN
  -- Increment delivery attempts and update error
  UPDATE public.event_outbox 
  SET 
    delivery_attempts = delivery_attempts + 1,
    error_count = error_count + 1,
    last_error = p_error_message,
    next_retry_at = now() + (interval '1 minute' * power(2, delivery_attempts)), -- Exponential backoff
    dead_letter = CASE 
      WHEN delivery_attempts + 1 >= max_attempts THEN true 
      ELSE false 
    END
  WHERE id = p_event_id
  RETURNING delivery_attempts, max_attempts INTO v_attempts, v_max_attempts;
  
  -- Log when event moves to dead letter queue
  IF v_attempts >= v_max_attempts THEN
    RAISE NOTICE 'Event % moved to dead letter queue after % attempts', p_event_id, v_attempts;
  END IF;
END;
$$;

-- Function to reprocess dead letter events
CREATE OR REPLACE FUNCTION public.reprocess_dead_letter_event(p_event_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.event_outbox 
  SET 
    dead_letter = false,
    delivery_attempts = 0,
    error_count = 0,
    next_retry_at = NULL,
    last_error = NULL
  WHERE id = p_event_id AND dead_letter = true;
END;
$$;

-- Function to clean up old delivered events
CREATE OR REPLACE FUNCTION public.cleanup_delivered_events(
  p_retention_days integer DEFAULT 30
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.event_outbox 
  WHERE delivered_at < (now() - interval '1 day' * p_retention_days);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get event statistics
CREATE OR REPLACE FUNCTION public.get_event_outbox_stats(
  p_tenant_id uuid DEFAULT NULL,
  p_hours integer DEFAULT 24
) RETURNS TABLE (
  total_events bigint,
  delivered_events bigint,
  pending_events bigint,
  failed_events bigint,
  dead_letter_events bigint,
  avg_delivery_time interval,
  top_event_types jsonb
) LANGUAGE sql AS $$
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(delivered_at) as delivered,
      COUNT(*) FILTER (WHERE delivered_at IS NULL AND dead_letter = false) as pending,
      COUNT(*) FILTER (WHERE error_count > 0 AND dead_letter = false) as failed,
      COUNT(*) FILTER (WHERE dead_letter = true) as dead_letter,
      AVG(delivered_at - occurred_at) FILTER (WHERE delivered_at IS NOT NULL) as avg_delivery,
      jsonb_agg(
        jsonb_build_object(
          'event_type', event_type,
          'count', count
        ) ORDER BY count DESC
      ) FILTER (WHERE rn <= 10) as top_types
    FROM (
      SELECT 
        *,
        COUNT(*) OVER (PARTITION BY event_type) as count,
        ROW_NUMBER() OVER (PARTITION BY event_type ORDER BY occurred_at DESC) as rn
      FROM public.event_outbox
      WHERE occurred_at >= (now() - interval '1 hour' * p_hours)
        AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    ) ranked
  )
  SELECT 
    total,
    delivered,
    pending,
    failed,
    dead_letter,
    avg_delivery,
    top_types
  FROM stats;
$$;
