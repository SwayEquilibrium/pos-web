-- ================================================
-- PRINT JOBS SCHEMA - PRINT JOB QUEUE SYSTEM
-- ================================================
-- This schema implements a robust print job queue with:
-- - Idempotency keys to prevent duplicate prints
-- - Retry logic with exponential backoff
-- - Status tracking and error logging
-- - Template versioning for reproducibility
-- - Security with RLS policies

-- Create print_jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE, -- Prevents duplicate prints for same content
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,

  -- Job content and metadata
  job_type TEXT NOT NULL CHECK (job_type IN ('receipt', 'kitchen', 'label', 'custom')),
  content_type TEXT NOT NULL DEFAULT 'text/plain' CHECK (content_type IN ('text/plain', 'text/html', 'application/json')),
  payload TEXT NOT NULL, -- The actual content to print
  rendered_content TEXT, -- Pre-rendered content for reproducibility

  -- Template versioning
  template_version TEXT, -- Version of template used for rendering
  template_data JSONB, -- Raw data used to generate content

  -- Status and lifecycle
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0, -- Higher numbers = higher priority

  -- Retry logic
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  retry_delay_minutes INTEGER DEFAULT 1, -- Base delay for exponential backoff
  next_retry_at TIMESTAMPTZ,

  -- Error tracking
  last_error TEXT,
  error_details JSONB,

  -- Context information
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context (payment info, etc.)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_idempotency_key ON print_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_next_retry_at ON print_jobs(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_jobs_priority ON print_jobs(priority DESC, created_at ASC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_print_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_print_jobs_updated_at
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_print_jobs_updated_at();

-- Row Level Security (RLS)
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only allow access to jobs for the user's company
CREATE POLICY "Users can view print jobs for their company" ON print_jobs
  FOR SELECT USING (
    printer_id IN (
      SELECT id FROM printers WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create print jobs for their company printers" ON print_jobs
  FOR INSERT WITH CHECK (
    printer_id IN (
      SELECT id FROM printers WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update print jobs for their company" ON print_jobs
  FOR UPDATE USING (
    printer_id IN (
      SELECT id FROM printers WHERE company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can do everything (for background processing)
CREATE POLICY "Service role has full access" ON print_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- PRINT JOB LOGS - AUDIT TRAIL
-- ================================================

CREATE TABLE IF NOT EXISTS print_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,

  -- Log entry details
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,

  -- Context
  printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for print job logs
CREATE INDEX IF NOT EXISTS idx_print_job_logs_print_job_id ON print_job_logs(print_job_id);
CREATE INDEX IF NOT EXISTS idx_print_job_logs_created_at ON print_job_logs(created_at DESC);

-- RLS for logs
ALTER TABLE print_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their company jobs" ON print_job_logs
  FOR SELECT USING (
    print_job_id IN (
      SELECT pj.id FROM print_jobs pj
      JOIN printers p ON pj.printer_id = p.id
      WHERE p.company_id IN (
        SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can create logs" ON print_job_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Function to calculate next retry time with exponential backoff
CREATE OR REPLACE FUNCTION calculate_next_retry_time(
  retry_count INTEGER,
  base_delay_minutes INTEGER DEFAULT 1
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  delay_minutes INTEGER;
BEGIN
  -- Exponential backoff: base_delay * 2^retry_count
  delay_minutes := base_delay_minutes * POWER(2, retry_count);
  -- Cap at 60 minutes max delay
  delay_minutes := LEAST(delay_minutes, 60);

  RETURN NOW() + INTERVAL '1 minute' * delay_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to create print job with idempotency
CREATE OR REPLACE FUNCTION create_print_job(
  p_idempotency_key TEXT,
  p_printer_id UUID,
  p_job_type TEXT,
  p_content_type TEXT DEFAULT 'text/plain',
  p_payload TEXT,
  p_rendered_content TEXT DEFAULT NULL,
  p_template_version TEXT DEFAULT NULL,
  p_template_data JSONB DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_max_retries INTEGER DEFAULT 3,
  p_order_id UUID DEFAULT NULL,
  p_table_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  -- Try to insert new job, ignore if idempotency key already exists
  INSERT INTO print_jobs (
    idempotency_key,
    printer_id,
    job_type,
    content_type,
    payload,
    rendered_content,
    priority,
    max_retries,
    order_id,
    table_id,
    user_id,
    metadata
  ) VALUES (
    p_idempotency_key,
    p_printer_id,
    p_job_type,
    p_content_type,
    p_payload,
    p_rendered_content,
    p_priority,
    p_max_retries,
    p_order_id,
    p_table_id,
    p_user_id,
    p_metadata
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO job_id;

  -- If job already exists, return its ID
  IF job_id IS NULL THEN
    SELECT id INTO job_id FROM print_jobs WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- NOTIFICATIONS FOR REAL-TIME UPDATES
-- ================================================

-- Function to notify about print job status changes
CREATE OR REPLACE FUNCTION notify_print_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify subscribers about status changes
  PERFORM pg_notify('print_job_status_change', json_build_object(
    'job_id', NEW.id,
    'status', NEW.status,
    'printer_id', NEW.printer_id,
    'order_id', NEW.order_id
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_print_job_status_change
  AFTER UPDATE OF status ON print_jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_print_job_status_change();

-- ================================================
-- CLEANUP POLICIES
-- ================================================

-- Clean up old completed jobs after 30 days
CREATE OR REPLACE FUNCTION cleanup_old_print_jobs()
RETURNS void AS $$
BEGIN
  -- Delete old completed jobs and their logs
  DELETE FROM print_job_logs
  WHERE print_job_id IN (
    SELECT id FROM print_jobs
    WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '30 days'
  );

  DELETE FROM print_jobs
  WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Clean up failed jobs after 90 days
CREATE OR REPLACE FUNCTION cleanup_failed_print_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM print_job_logs
  WHERE print_job_id IN (
    SELECT id FROM print_jobs
    WHERE status = 'failed'
    AND retry_count >= max_retries
    AND updated_at < NOW() - INTERVAL '90 days'
  );

  DELETE FROM print_jobs
  WHERE status = 'failed'
  AND retry_count >= max_retries
  AND updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VIEWS FOR OPERATIONAL DASHBOARDS
-- ================================================

-- View for print queue status
CREATE OR REPLACE VIEW print_queue_status AS
SELECT
  p.name as printer_name,
  p.display_name,
  COUNT(CASE WHEN pj.status = 'queued' THEN 1 END) as queued_count,
  COUNT(CASE WHEN pj.status = 'processing' THEN 1 END) as processing_count,
  COUNT(CASE WHEN pj.status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN pj.status = 'completed' THEN 1 END) as completed_count,
  MAX(pj.created_at) as last_job_at,
  AVG(CASE WHEN pj.status = 'completed' THEN EXTRACT(EPOCH FROM (pj.completed_at - pj.created_at)) END) as avg_processing_time_seconds
FROM printers p
LEFT JOIN print_jobs pj ON p.id = pj.printer_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.display_name;

-- View for print job failure rates
CREATE OR REPLACE VIEW print_failure_rates AS
SELECT
  p.name as printer_name,
  p.display_name,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN pj.status = 'failed' THEN 1 END) as failed_jobs,
  ROUND(
    COUNT(CASE WHEN pj.status = 'failed' THEN 1 END)::decimal /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as failure_rate_percent,
  MAX(CASE WHEN pj.status = 'failed' THEN pj.updated_at END) as last_failure_at
FROM printers p
LEFT JOIN print_jobs pj ON p.id = pj.printer_id
WHERE pj.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY p.id, p.name, p.display_name;

-- Grant permissions
GRANT SELECT ON print_queue_status TO authenticated;
GRANT SELECT ON print_failure_rates TO authenticated;



