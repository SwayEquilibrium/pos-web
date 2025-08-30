import * as printJobsRepo from '@/lib/repos/printJobs.repo'
import * as printersRepo from '@/lib/repos/printers.repo'

// ================================================
// PRINT JOB PROCESSOR - BACKGROUND WORKER
// ================================================

export interface PrintJobResult {
  success: boolean
  jobId: string
  error?: string
  retryable?: boolean
  retryAfter?: number // minutes
}

export class PrintJobProcessor {
  private isProcessing = false
  private maxConcurrentJobs = 5
  private processingJobs = new Set<string>()

  // ================================================
  // MAIN PROCESSING LOOP
  // ================================================

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('🔄 Print job processor already running')
      return
    }

    this.isProcessing = true
    console.log('🚀 Starting print job processor')

    try {
      // Process jobs in batches
      let processedCount = 0
      const maxIterations = 10 // Prevent infinite loops

      for (let i = 0; i < maxIterations; i++) {
        const batchSize = Math.min(this.maxConcurrentJobs - this.processingJobs.size, 10)
        if (batchSize <= 0) break

        const jobs = await this.getJobsToProcess(batchSize)
        if (jobs.length === 0) break

        console.log(`📋 Processing batch of ${jobs.length} print jobs`)

        // Process jobs concurrently
        const results = await Promise.allSettled(
          jobs.map(job => this.processJob(job))
        )

        processedCount += jobs.length

        // Log results
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
        const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length
        const errors = results.filter(r => r.status === 'rejected').length

        console.log(`✅ Batch complete: ${successful} successful, ${failed} failed, ${errors} errors`)

        // Small delay between batches
        if (jobs.length === batchSize) {
          await this.delay(1000)
        }
      }

      console.log(`🎉 Print job processor completed - processed ${processedCount} jobs`)

    } catch (error) {
      console.error('❌ Print job processor error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // ================================================
  // JOB SELECTION AND PROCESSING
  // ================================================

  private async getJobsToProcess(limit: number): Promise<printJobsRepo.PrintJob[]> {
    try {
      // Get regular queued jobs
      const queuedJobs = await printJobsRepo.getQueuedJobs(limit)

      // Get jobs that need retry
      const retryJobs = await printJobsRepo.getJobsForRetry()

      // Combine and deduplicate
      const allJobs = [...queuedJobs, ...retryJobs]
      const uniqueJobs = allJobs.filter((job, index, self) =>
        index === self.findIndex(j => j.id === job.id)
      )

      // Sort by priority and creation time
      return uniqueJobs
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority // Higher priority first
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        .slice(0, limit)

    } catch (error) {
      console.error('❌ Failed to get jobs to process:', error)
      return []
    }
  }

  private async processJob(job: printJobsRepo.PrintJob): Promise<PrintJobResult> {
    const jobId = job.id

    // Prevent concurrent processing of the same job
    if (this.processingJobs.has(jobId)) {
      console.log(`⚠️ Job ${jobId} already being processed`)
      return { success: false, jobId, error: 'Job already processing' }
    }

    this.processingJobs.add(jobId)

    try {
      console.log(`🔄 Processing print job ${jobId} (${job.job_type})`)

      // Update job status to processing
      await printJobsRepo.updatePrintJobStatus(jobId, 'processing')
      await printJobsRepo.logPrintJobActivity(
        jobId,
        'info',
        `Started processing ${job.job_type} job`,
        { printer_id: job.printer_id },
        job.printer_id,
        job.order_id
      )

      // Process the job
      const result = await this.executePrintJob(job)

      if (result.success) {
        // Mark as completed
        await printJobsRepo.updatePrintJobStatus(jobId, 'completed')
        await printJobsRepo.logPrintJobActivity(
          jobId,
          'info',
          'Print job completed successfully',
          result,
          job.printer_id,
          job.order_id
        )
        console.log(`✅ Print job ${jobId} completed successfully`)
      } else {
        // Handle failure
        await this.handleJobFailure(job, result)
      }

      return result

    } catch (error) {
      console.error(`❌ Error processing print job ${jobId}:`, error)
      await this.handleJobFailure(job, {
        success: false,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      })
      return { success: false, jobId, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      this.processingJobs.delete(jobId)
    }
  }

  // ================================================
  // JOB EXECUTION
  // ================================================

  private async executePrintJob(job: printJobsRepo.PrintJob): Promise<PrintJobResult> {
    try {
      // Get printer details
      const printer = await printersRepo.getPrinter(job.printer_id)
      if (!printer) {
        return {
          success: false,
          jobId: job.id,
          error: 'Printer not found',
          retryable: false
        }
      }

      // Prepare print data based on job type
      const printData = this.preparePrintData(job)

      // Execute the print
      const result = await this.sendToPrinter(printer, printData, job)

      return {
        success: result.success,
        jobId: job.id,
        error: result.error
      }

    } catch (error) {
      return {
        success: false,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Print execution failed',
        retryable: true
      }
    }
  }

  private preparePrintData(job: printJobsRepo.PrintJob): any {
    // Parse the payload based on content type
    if (job.content_type === 'application/json') {
      try {
        return JSON.parse(job.payload)
      } catch (error) {
        console.warn(`⚠️ Failed to parse JSON payload for job ${job.id}:`, error)
        return { rawContent: job.payload }
      }
    }

    // For other content types, return as-is
    return {
      content: job.payload,
      contentType: job.content_type,
      jobType: job.job_type
    }
  }

  private async sendToPrinter(
    printer: printersRepo.Printer,
    printData: any,
    job: printJobsRepo.PrintJob
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🖨️ Sending job ${job.id} to printer ${printer.display_name}`)

      // Use the existing /api/print endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
        },
        body: JSON.stringify({
          printerIP: printer.ip_address || printer.connection_string, // Support both field names
          printData,
          printType: job.job_type,
          jobId: job.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Print successful for job ${job.id}:`, result)
        return { success: true }
      } else {
        const error = await response.json()
        console.error(`❌ Print failed for job ${job.id}:`, error)
        return {
          success: false,
          error: error.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

    } catch (error) {
      console.error(`❌ Network error printing job ${job.id}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // ================================================
  // ERROR HANDLING AND RETRY LOGIC
  // ================================================

  private async handleJobFailure(
    job: printJobsRepo.PrintJob,
    result: PrintJobResult
  ): Promise<void> {
    const currentRetryCount = job.retry_count + 1
    const canRetry = result.retryable !== false && currentRetryCount < job.max_retries

    if (canRetry) {
      console.log(`🔄 Marking job ${job.id} for retry (${currentRetryCount}/${job.max_retries})`)
      await printJobsRepo.markJobForRetry(job.id)
      await printJobsRepo.logPrintJobActivity(
        job.id,
        'warning',
        `Print failed, scheduled for retry ${currentRetryCount}/${job.max_retries}`,
        {
          error: result.error,
          retry_count: currentRetryCount,
          max_retries: job.max_retries
        },
        job.printer_id,
        job.order_id
      )
    } else {
      console.log(`❌ Marking job ${job.id} as permanently failed`)
      await printJobsRepo.updatePrintJobStatus(
        job.id,
        'failed',
        result.error,
        {
          final_retry_count: currentRetryCount,
          max_retries: job.max_retries
        }
      )
      await printJobsRepo.logPrintJobActivity(
        job.id,
        'error',
        `Print job failed permanently: ${result.error}`,
        {
          error: result.error,
          retry_count: currentRetryCount,
          max_retries: job.max_retries
        },
        job.printer_id,
        job.order_id
      )
    }
  }

  // ================================================
  // UTILITY METHODS
  // ================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Method to manually trigger processing (useful for testing)
  async processSingleJob(jobId: string): Promise<PrintJobResult> {
    const job = await printJobsRepo.getPrintJob(jobId)
    if (!job) {
      return { success: false, jobId, error: 'Job not found' }
    }

    return this.processJob(job)
  }

  // Get processor status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processingJobsCount: this.processingJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs
    }
  }

  // Stop processing
  stop() {
    this.isProcessing = false
    console.log('🛑 Print job processor stopped')
  }
}

// ================================================
// SINGLETON INSTANCE
// ================================================

export const printJobProcessor = new PrintJobProcessor()

// ================================================
// CONVENIENCE FUNCTIONS
// ================================================

export async function processPrintQueue(): Promise<void> {
  return printJobProcessor.processQueue()
}

export async function processSinglePrintJob(jobId: string): Promise<PrintJobResult> {
  return printJobProcessor.processSingleJob(jobId)
}

export function getPrintProcessorStatus() {
  return printJobProcessor.getStatus()
}

export function stopPrintProcessor() {
  printJobProcessor.stop()
}



