-- Event Outbox System v1.0
-- Reliable event processing for side effects

CREATE TABLE public.event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  aggregate_type varchar(50) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  event_data jsonb NOT NULL,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  causation_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  error_message text
);

CREATE INDEX idx_event_outbox_processing 
ON public.event_outbox(company_id, processed_at, next_retry_at)
WHERE processed_at IS NULL;

CREATE INDEX idx_event_outbox_correlation 
ON public.event_outbox(correlation_id);

CREATE INDEX idx_event_outbox_aggregate 
ON public.event_outbox(aggregate_type, aggregate_id, occurred_at DESC);

-- Event emission function
CREATE OR REPLACE FUNCTION emit_domain_event(
  p_aggregate_type varchar(50),
  p_aggregate_id uuid,
  p_event_type varchar(100),
  p_event_data jsonb,
  p_correlation_id uuid DEFAULT gen_random_uuid()
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_company_id uuid;
  v_event_id uuid;
BEGIN
  SELECT company_id INTO v_company_id 
  FROM public.user_profiles WHERE id = auth.uid();
  
  INSERT INTO public.event_outbox (
    company_id, aggregate_type, aggregate_id, 
    event_type, event_data, correlation_id
  ) VALUES (
    v_company_id, p_aggregate_type, p_aggregate_id,
    p_event_type, p_event_data, p_correlation_id
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Order event triggers
CREATE OR REPLACE FUNCTION emit_order_events()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Order status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM emit_domain_event(
      'order',
      NEW.id,
      'OrderStatusChanged',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'table_id', NEW.table_id,
        'order_type', NEW.type,
        'changed_at', now()
      )
    );
    
    -- Specific events for important status changes
    IF NEW.status = 'paid' THEN
      PERFORM emit_domain_event(
        'order',
        NEW.id,
        'OrderCompleted',
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'total_amount', NEW.total_amount,
          'payment_method', NEW.payment_method,
          'completed_at', now()
        )
      );
    END IF;
  END IF;
  
  -- New orders
  IF TG_OP = 'INSERT' THEN
    PERFORM emit_domain_event(
      'order',
      NEW.id,
      'OrderCreated',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'order_type', NEW.type,
        'table_id', NEW.table_id,
        'created_at', NEW.created_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Payment event triggers
CREATE OR REPLACE FUNCTION emit_payment_events()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM emit_domain_event(
      'payment',
      NEW.id,
      'PaymentProcessed',
      jsonb_build_object(
        'payment_id', NEW.id,
        'order_id', NEW.order_id,
        'payment_method', NEW.payment_method,
        'amount', NEW.amount,
        'status', NEW.status,
        'processed_at', NEW.processed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS order_events ON public.orders;
CREATE TRIGGER order_events
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION emit_order_events();

DROP TRIGGER IF EXISTS payment_events ON public.payment_transactions;
CREATE TRIGGER payment_events
  AFTER INSERT ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION emit_payment_events();

-- Event processing functions
CREATE OR REPLACE FUNCTION get_unprocessed_events(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  aggregate_type varchar,
  aggregate_id uuid,
  event_type varchar,
  event_data jsonb,
  correlation_id uuid,
  occurred_at timestamptz,
  retry_count integer
) LANGUAGE sql AS $$
  SELECT 
    e.id, e.company_id, e.aggregate_type, e.aggregate_id,
    e.event_type, e.event_data, e.correlation_id, 
    e.occurred_at, e.retry_count
  FROM public.event_outbox e
  WHERE e.processed_at IS NULL
    AND (e.next_retry_at IS NULL OR e.next_retry_at <= now())
    AND e.retry_count < e.max_retries
  ORDER BY e.occurred_at
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION mark_event_processed(p_event_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.event_outbox 
  SET processed_at = now()
  WHERE id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_event_failed(p_event_id uuid, p_error_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.event_outbox 
  SET 
    retry_count = retry_count + 1,
    next_retry_at = now() + (interval '1 minute' * power(2, retry_count)), -- Exponential backoff
    error_message = p_error_message
  WHERE id = p_event_id;
END;
$$;

-- RLS policies
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolated events" ON public.event_outbox FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
  )
);
