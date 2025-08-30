import { supabase } from '@/lib/supabaseClient'

// ================================================
// PRINT JOBS REPOSITORY - PRINT JOB QUEUE SYSTEM
// ================================================

export interface PrintJob {
  id: string
  idempotency_key: string
  printer_id: string
  job_type: 'receipt' | 'kitchen' | 'label' | 'custom'
  content_type: string
  payload: string
  rendered_content?: string
  template_version?: string
  template_data?: any
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: number
  max_retries: number
  retry_count: number
  retry_delay_minutes: number
  next_retry_at?: string
  last_error?: string
  error_details?: any
  order_id?: string
  table_id?: string
  user_id?: string
  metadata?: any
  created_at: string
  updated_at: string
  processed_at?: string
  completed_at?: string
}

export interface PrintJobLog {
  id: string
  print_job_id: string
  log_level: 'info' | 'warning' | 'error'
  message: string
  details?: any
  printer_id?: string
  order_id?: string
  created_at: string
}

// ================================================
// PRINT JOB CRUD OPERATIONS
// ================================================

export async function createPrintJob(jobData: {
  idempotencyKey: string
  printerId: string
  jobType: 'receipt' | 'kitchen' | 'label' | 'custom'
  contentType?: string
  payload: string
  renderedContent?: string
  templateVersion?: string
  templateData?: any
  priority?: number
  maxRetries?: number
  orderId?: string
  tableId?: string
  userId?: string
  metadata?: any
}): Promise<PrintJob> {
  const { data, error } = await supabase
    .rpc('create_print_job', {
      p_idempotency_key: jobData.idempotencyKey,
      p_printer_id: jobData.printerId,
      p_job_type: jobData.jobType,
      p_content_type: jobData.contentType || 'text/plain',
      p_payload: jobData.payload,
      p_rendered_content: jobData.renderedContent,
      p_template_version: jobData.templateVersion,
      p_template_data: jobData.templateData,
      p_priority: jobData.priority || 0,
      p_max_retries: jobData.maxRetries || 3,
      p_order_id: jobData.orderId,
      p_table_id: jobData.tableId,
      p_user_id: jobData.userId,
      p_metadata: jobData.metadata || {}
    })

  if (error) {
    console.error('[createPrintJob] Error:', error)
    throw new Error(`Failed to create print job: ${error.message}`)
  }

  // If we get a UUID back, fetch the created job
  if (data) {
    return getPrintJob(data)
  }

  throw new Error('Failed to create print job - no ID returned')
}

export async function getPrintJob(id: string): Promise<PrintJob | null> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No rows returned
    }
    console.error('[getPrintJob] Error:', error)
    throw new Error(`Failed to fetch print job: ${error.message}`)
  }

  return data
}

export async function getPrintJobByIdempotencyKey(idempotencyKey: string): Promise<PrintJob | null> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No rows returned
    }
    console.error('[getPrintJobByIdempotencyKey] Error:', error)
    throw new Error(`Failed to fetch print job by idempotency key: ${error.message}`)
  }

  return data
}

export async function updatePrintJobStatus(
  id: string,
  status: PrintJob['status'],
  errorMessage?: string,
  errorDetails?: any
): Promise<PrintJob> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'processing') {
    updates.processed_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  } else if (status === 'failed' && errorMessage) {
    updates.last_error = errorMessage
    updates.error_details = errorDetails
    // Get current retry count and increment
    const currentJob = await getPrintJob(id)
    if (currentJob) {
      updates.retry_count = (currentJob.retry_count || 0) + 1
    }
  }

  const { data, error } = await supabase
    .from('print_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updatePrintJobStatus] Error:', error)
    throw new Error(`Failed to update print job status: ${error.message}`)
  }

  return data
}

export async function markJobForRetry(id: string): Promise<PrintJob> {
  // Get current job data
  const job = await getPrintJob(id)
  if (!job) {
    throw new Error('Print job not found')
  }

  // Calculate next retry time
  const nextRetryAt = new Date()
  const delayMinutes = job.retry_delay_minutes * Math.pow(2, job.retry_count)
  nextRetryAt.setMinutes(nextRetryAt.getMinutes() + Math.min(delayMinutes, 60)) // Cap at 60 minutes

  const { data, error } = await supabase
    .from('print_jobs')
    .update({
      status: 'queued',
      next_retry_at: nextRetryAt.toISOString(),
      retry_count: job.retry_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[markJobForRetry] Error:', error)
    throw new Error(`Failed to mark job for retry: ${error.message}`)
  }

  return data
}

// ================================================
// QUEUE MANAGEMENT
// ================================================

export async function getQueuedJobs(limit: number = 50): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[getQueuedJobs] Error:', error)
    throw new Error(`Failed to fetch queued jobs: ${error.message}`)
  }

  return data || []
}

export async function getJobsForRetry(): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3) // max_retries = 3
    .or(`next_retry_at.is.null,next_retry_at.lt.${new Date().toISOString()}`)
    .order('next_retry_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[getJobsForRetry] Error:', error)
    throw new Error(`Failed to fetch jobs for retry: ${error.message}`)
  }

  return data || []
}

export async function getJobsByPrinter(printerId: string, status?: PrintJob['status'][]): Promise<PrintJob[]> {
  let query = supabase
    .from('print_jobs')
    .select('*')
    .eq('printer_id', printerId)
    .order('created_at', { ascending: false })

  if (status && status.length > 0) {
    query = query.in('status', status)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('[getJobsByPrinter] Error:', error)
    throw new Error(`Failed to fetch jobs by printer: ${error.message}`)
  }

  return data || []
}

export async function getJobsByOrder(orderId: string): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getJobsByOrder] Error:', error)
    throw new Error(`Failed to fetch jobs by order: ${error.message}`)
  }

  return data || []
}

// ================================================
// LOGGING
// ================================================

export async function logPrintJobActivity(
  printJobId: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  details?: any,
  printerId?: string,
  orderId?: string
): Promise<void> {
  const { error } = await supabase
    .from('print_job_logs')
    .insert({
      print_job_id: printJobId,
      log_level: level,
      message,
      details,
      printer_id: printerId,
      order_id: orderId
    })

  if (error) {
    console.error('[logPrintJobActivity] Error:', error)
    // Don't throw here to avoid breaking the main flow
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export async function cancelPrintJob(id: string, reason?: string): Promise<PrintJob> {
  const { data, error } = await supabase
    .from('print_jobs')
    .update({
      status: 'cancelled',
      last_error: reason || 'Job cancelled by user',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[cancelPrintJob] Error:', error)
    throw new Error(`Failed to cancel print job: ${error.message}`)
  }

  return data
}

export async function reprintJob(originalJobId: string, reason?: string): Promise<PrintJob> {
  // Get the original job
  const originalJob = await getPrintJob(originalJobId)
  if (!originalJob) {
    throw new Error('Original print job not found')
  }

  // Create new idempotency key for the reprint
  const reprintIdempotencyKey = `${originalJob.idempotency_key}_reprint_${Date.now()}`

  // Create new job with same content but new idempotency key
  return createPrintJob({
    idempotencyKey: reprintIdempotencyKey,
    printerId: originalJob.printer_id,
    jobType: originalJob.job_type,
    contentType: originalJob.content_type,
    payload: originalJob.payload,
    renderedContent: originalJob.rendered_content,
    templateVersion: originalJob.template_version,
    templateData: originalJob.template_data,
    priority: 10, // Higher priority for reprints
    orderId: originalJob.order_id,
    tableId: originalJob.table_id,
    userId: originalJob.user_id,
    metadata: {
      ...originalJob.metadata,
      reprint_of: originalJobId,
      reprint_reason: reason || 'Manual reprint'
    }
  })
}

// ================================================
// DASHBOARD FUNCTIONS
// ================================================

export async function getPrintQueueStatus(): Promise<any[]> {
  const { data, error } = await supabase
    .from('print_queue_status')
    .select('*')

  if (error) {
    console.error('[getPrintQueueStatus] Error:', error)
    throw new Error(`Failed to fetch print queue status: ${error.message}`)
  }

  return data || []
}

export async function getPrintFailureRates(): Promise<any[]> {
  const { data, error } = await supabase
    .from('print_failure_rates')
    .select('*')

  if (error) {
    console.error('[getPrintFailureRates] Error:', error)
    throw new Error(`Failed to fetch print failure rates: ${error.message}`)
  }

  return data || []
}

// ================================================
// ID GENERATION UTILITIES
// ================================================

export function generateIdempotencyKey(
  jobType: string,
  printerId: string,
  orderId?: string,
  contentHash?: string
): string {
  const components = [jobType, printerId]

  if (orderId) {
    components.push(orderId)
  }

  if (contentHash) {
    components.push(contentHash)
  } else {
    // Fallback to timestamp for uniqueness
    components.push(Date.now().toString())
  }

  return components.join('_')
}

export function generateContentHash(content: string): string {
  // Simple hash function - in production you might want a more robust one
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

