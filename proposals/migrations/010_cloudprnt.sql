-- CloudPRNT Print Jobs Queue Migration
-- Star CloudPRNT implementation for reliable printer communication
-- Run this in Supabase SQL Editor

-- Create print jobs table for CloudPRNT queue
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' 
    CHECK (status IN ('QUEUED', 'DELIVERED', 'PRINTED', 'FAILED')),
  content_type TEXT NOT NULL DEFAULT 'text/plain',
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  printed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata for tracking
  order_id UUID, -- Optional reference to orders table
  receipt_type TEXT, -- 'kitchen', 'customer', 'receipt', etc.
  retry_count INTEGER DEFAULT 0,
  
  -- Indexes for performance
  CONSTRAINT print_jobs_retry_count_check CHECK (retry_count >= 0)
);

-- Index for efficient polling by printers
CREATE INDEX IF NOT EXISTS ix_print_jobs_printer_status 
ON public.print_jobs (printer_id, status, created_at);

-- Index for cleanup and monitoring
CREATE INDEX IF NOT EXISTS ix_print_jobs_created_at 
ON public.print_jobs (created_at);

-- Index for order tracking
CREATE INDEX IF NOT EXISTS ix_print_jobs_order_id 
ON public.print_jobs (order_id) 
WHERE order_id IS NOT NULL;

-- Function to clean up old print jobs (optional)
CREATE OR REPLACE FUNCTION public.cleanup_old_print_jobs(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.print_jobs 
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND status IN ('PRINTED', 'FAILED');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON public.print_jobs TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the table creation
DO $$
BEGIN
  -- Insert a test job to verify table structure
  INSERT INTO public.print_jobs (printer_id, payload, content_type)
  VALUES ('test-printer', 'CloudPRNT Test Job', 'text/plain');
  
  -- Clean up test job
  DELETE FROM public.print_jobs WHERE printer_id = 'test-printer';
  
  RAISE NOTICE 'CloudPRNT print_jobs table created successfully';
END;
$$;
