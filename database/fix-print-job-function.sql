-- ================================================
-- FIXED CREATE_PRINT_JOB FUNCTION
-- ================================================
-- PostgreSQL requires that once a parameter has a default value,
-- all subsequent parameters must also have default values

CREATE OR REPLACE FUNCTION create_print_job(
  p_idempotency_key TEXT,
  p_printer_id UUID,
  p_job_type TEXT,
  p_payload TEXT,
  p_content_type TEXT DEFAULT 'text/plain',
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
  INSERT INTO print_jobs (
    idempotency_key,
    printer_id,
    job_type,
    content_type,
    payload,
    rendered_content,
    template_version,
    template_data,
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
    p_template_version,
    p_template_data,
    p_priority,
    p_max_retries,
    p_order_id,
    p_table_id,
    p_user_id,
    p_metadata
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO job_id;

  IF job_id IS NULL THEN
    SELECT id INTO job_id FROM print_jobs WHERE idempotency_key = p_idempotency_key;
  END IF;

  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
