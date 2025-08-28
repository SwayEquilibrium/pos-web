-- ================================================
-- EVENT OUTBOX SYSTEM FOR RELIABLE SIDE EFFECTS
-- Ensures side effects are processed reliably
-- ================================================

-- Create event outbox table
CREATE TABLE IF NOT EXISTS public.event_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_outbox_status ON public.event_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_event_outbox_type ON public.event_outbox(event_type, status);
CREATE INDEX IF NOT EXISTS idx_event_outbox_retry ON public.event_outbox(retry_count, max_retries, status);

-- Function to add event to outbox
CREATE OR REPLACE FUNCTION add_event_to_outbox(
  p_event_type TEXT,
  p_event_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.event_outbox (event_type, event_data)
  VALUES (p_event_type, p_event_data)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark event as processing
CREATE OR REPLACE FUNCTION mark_event_processing(p_event_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.event_outbox 
  SET 
    status = 'processing',
    updated_at = NOW()
  WHERE id = p_event_id 
    AND status = 'pending'
    AND retry_count < max_retries;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark event as completed
CREATE OR REPLACE FUNCTION mark_event_completed(p_event_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.event_outbox 
  SET 
    status = 'completed',
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark event as failed
CREATE OR REPLACE FUNCTION mark_event_failed(
  p_event_id UUID, 
  p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.event_outbox 
  SET 
    status = CASE 
      WHEN retry_count + 1 >= max_retries THEN 'failed'
      ELSE 'pending'
    END,
    retry_count = retry_count + 1,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next batch of pending events
CREATE OR REPLACE FUNCTION get_pending_events(
  p_batch_size INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  event_type TEXT,
  event_data JSONB,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eo.id,
    eo.event_type,
    eo.event_data,
    eo.retry_count
  FROM public.event_outbox eo
  WHERE eo.status = 'pending'
    AND eo.retry_count < eo.max_retries
  ORDER BY eo.created_at ASC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old completed events
CREATE OR REPLACE FUNCTION cleanup_old_events(p_days_to_keep INTEGER DEFAULT 30) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.event_outbox 
  WHERE status = 'completed' 
    AND processed_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for event outbox
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage events
CREATE POLICY "Users can manage event outbox" ON public.event_outbox
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.event_outbox TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


