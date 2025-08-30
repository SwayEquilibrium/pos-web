import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as printJobsRepo from '@/lib/repos/printJobs.repo'
import { usePrinters } from './usePrinters'

// ================================================
// PRINT JOBS HOOKS - REACT QUERY INTEGRATION
// ================================================

// Query keys
const printJobsKeys = {
  all: ['print-jobs'] as const,
  lists: () => [...printJobsKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...printJobsKeys.lists(), filters] as const,
  details: () => [...printJobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...printJobsKeys.details(), id] as const,
  queue: () => [...printJobsKeys.all, 'queue'] as const,
  byPrinter: (printerId: string) => [...printJobsKeys.all, 'printer', printerId] as const,
  byOrder: (orderId: string) => [...printJobsKeys.all, 'order', orderId] as const,
  dashboard: () => [...printJobsKeys.all, 'dashboard'] as const
}

// ================================================
// PRINT JOB CRUD HOOKS
// ================================================

export function usePrintJobs(options?: {
  status?: printJobsRepo.PrintJob['status'][]
  printerId?: string
  orderId?: string
  limit?: number
}) {
  return useQuery({
    queryKey: printJobsKeys.list(options || {}),
    queryFn: async () => {
      // This is a simplified implementation
      // In a real app, you'd have a more sophisticated filtering system
      if (options?.printerId) {
        return printJobsRepo.getJobsByPrinter(options.printerId, options.status)
      }
      if (options?.orderId) {
        return printJobsRepo.getJobsByOrder(options.orderId)
      }

      // For now, return empty array - implement full filtering later
      return []
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePrintJob(id: string) {
  return useQuery({
    queryKey: printJobsKeys.detail(id),
    queryFn: () => printJobsRepo.getPrintJob(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds
  })
}

export function useCreatePrintJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: printJobsRepo.createPrintJob,
    onSuccess: (newJob) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: printJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: printJobsKeys.byPrinter(newJob.printer_id) })
      if (newJob.order_id) {
        queryClient.invalidateQueries({ queryKey: printJobsKeys.byOrder(newJob.order_id) })
      }
    },
  })
}

export function useCancelPrintJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      printJobsRepo.cancelPrintJob(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: printJobsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: printJobsKeys.lists() })
    },
  })
}

export function useReprintJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ originalJobId, reason }: { originalJobId: string; reason?: string }) =>
      printJobsRepo.reprintJob(originalJobId, reason),
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: printJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: printJobsKeys.byPrinter(newJob.printer_id) })
      if (newJob.order_id) {
        queryClient.invalidateQueries({ queryKey: printJobsKeys.byOrder(newJob.order_id) })
      }
    },
  })
}

// ================================================
// QUEUE MANAGEMENT HOOKS
// ================================================

export function usePrintQueue() {
  return useQuery({
    queryKey: printJobsKeys.queue(),
    queryFn: () => printJobsRepo.getQueuedJobs(),
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    staleTime: 5 * 1000, // 5 seconds
  })
}

export function usePrintJobsByPrinter(printerId: string) {
  return useQuery({
    queryKey: printJobsKeys.byPrinter(printerId),
    queryFn: () => printJobsRepo.getJobsByPrinter(printerId),
    enabled: !!printerId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePrintJobsByOrder(orderId: string) {
  return useQuery({
    queryKey: printJobsKeys.byOrder(orderId),
    queryFn: () => printJobsRepo.getJobsByOrder(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ================================================
// DASHBOARD HOOKS
// ================================================

export function usePrintQueueStatus() {
  return useQuery({
    queryKey: [...printJobsKeys.dashboard(), 'queue-status'],
    queryFn: printJobsRepo.getPrintQueueStatus,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // 10 seconds
  })
}

export function usePrintFailureRates() {
  return useQuery({
    queryKey: [...printJobsKeys.dashboard(), 'failure-rates'],
    queryFn: printJobsRepo.getPrintFailureRates,
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ================================================
// CONVENIENCE HOOKS FOR COMMON OPERATIONS
// ================================================

export function usePrintReceipt() {
  const createPrintJob = useCreatePrintJob()
  const { generateIdempotencyKey, generateContentHash } = printJobsRepo

  return useMutation({
    mutationFn: async ({
      printerId,
      orderId,
      receiptData,
      orderNumber,
      totalAmount
    }: {
      printerId: string
      orderId: string
      receiptData: any
      orderNumber: string
      totalAmount: number
    }) => {
      const content = JSON.stringify({
        type: 'receipt',
        orderNumber,
        totalAmount,
        items: receiptData.items || [],
        timestamp: new Date().toISOString()
      })

      const contentHash = generateContentHash(content)
      const idempotencyKey = generateIdempotencyKey('receipt', printerId, orderId, contentHash)

      return printJobsRepo.createPrintJob({
        idempotencyKey,
        printerId,
        jobType: 'receipt',
        contentType: 'application/json',
        payload: content,
        renderedContent: content, // For now, use raw JSON
        orderId,
        metadata: {
          orderNumber,
          totalAmount,
          itemCount: receiptData.items?.length || 0
        }
      })
    },
    onSuccess: (job) => {
      console.log('✅ Receipt print job created:', job.id)
    },
    onError: (error) => {
      console.error('❌ Failed to create receipt print job:', error)
    }
  })
}

export function usePrintKitchenReceipt() {
  const createPrintJob = useCreatePrintJob()
  const { generateIdempotencyKey, generateContentHash } = printJobsRepo

  return useMutation({
    mutationFn: async ({
      printerId,
      orderId,
      kitchenData,
      orderNumber,
      tableName
    }: {
      printerId: string
      orderId: string
      kitchenData: any
      orderNumber: string
      tableName?: string
    }) => {
      const content = JSON.stringify({
        type: 'kitchen',
        orderNumber,
        tableName: tableName || 'Takeaway',
        items: kitchenData.items || [],
        timestamp: new Date().toISOString()
      })

      const contentHash = generateContentHash(content)
      const idempotencyKey = generateIdempotencyKey('kitchen', printerId, orderId, contentHash)

      return printJobsRepo.createPrintJob({
        idempotencyKey,
        printerId,
        jobType: 'kitchen',
        contentType: 'application/json',
        payload: content,
        renderedContent: content,
        orderId,
        priority: 5, // Higher priority for kitchen receipts
        metadata: {
          orderNumber,
          tableName: tableName || 'Takeaway',
          itemCount: kitchenData.items?.length || 0,
          urgent: kitchenData.urgent || false
        }
      })
    },
    onSuccess: (job) => {
      console.log('✅ Kitchen receipt print job created:', job.id)
    },
    onError: (error) => {
      console.error('❌ Failed to create kitchen receipt print job:', error)
    }
  })
}

// ================================================
// AUTO-PRINT HOOKS (BACKWARD COMPATIBILITY)
// ================================================

export function useAutoPrintReceipt() {
  const printReceipt = usePrintReceipt()
  const printKitchen = usePrintKitchenReceipt()
  const { data: printers = [] } = usePrinters()

  return useMutation({
    mutationFn: async ({
      context,
      orderId,
      orderNumber,
      totalAmount,
      items,
      tableName
    }: {
      context: 'payment' | 'order'
      orderId: string
      orderNumber: string
      totalAmount: number
      items: any[]
      tableName?: string
    }) => {
      const results = []

      // Find printers configured for this context
      const configuredPrinters = printers.filter(printer => {
        if (context === 'order') {
          // Check both old and new field names for compatibility
          const hasKitchenPrint = printer.print_kitchen_receipts || printer.auto_print_on_order
          return hasKitchenPrint && printer.is_active
        } else {
          const hasReceiptPrint = printer.print_customer_receipts || printer.auto_print_on_payment
          return hasReceiptPrint && printer.is_active
        }
      })

      if (configuredPrinters.length === 0) {
        console.log(`ℹ️ No printers configured for auto-print on ${context}`)
        return []
      }

      // Print to each configured printer
      for (const printer of configuredPrinters) {
        try {
          if (context === 'order') {
            // Print kitchen receipt
            const result = await printKitchen.mutateAsync({
              printerId: printer.id,
              orderId,
              kitchenData: { items },
              orderNumber,
              tableName
            })
            results.push(result)
          } else {
            // Print customer receipt
            const result = await printReceipt.mutateAsync({
              printerId: printer.id,
              orderId,
              receiptData: { items },
              orderNumber,
              totalAmount
            })
            results.push(result)
          }

          console.log(`✅ Auto-print successful for printer ${printer.display_name || printer.name}`)
        } catch (error) {
          console.error(`❌ Auto-print failed for printer ${printer.display_name || printer.name}:`, error)

          // Try direct printing as fallback
          try {
            console.log(`🔄 Attempting direct print fallback for printer ${printer.display_name || printer.name}`)
            const directResult = await directPrintToPrinter(printer, {
              orderId,
              orderNumber,
              totalAmount,
              items,
              tableName
            }, context)
            results.push(directResult)
          } catch (directError) {
            console.error(`❌ Direct print fallback also failed:`, directError)
            results.push({
              printer_id: printer.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }

      return results
    }
  })
}

// ================================================
// DIRECT PRINTING FALLBACK
// ================================================

async function directPrintToPrinter(printer: any, printData: any, context: 'order' | 'payment') {
  try {
    console.log(`🖨️ Direct printing to ${printer.display_name || printer.name} (${printer.connection_string})`)

    const response = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: printer.connection_string || printer.ip_address,
        printData,
        printType: context === 'order' ? 'kitchen' : 'receipt',
        useQueue: false // Direct printing, not queued
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Direct print successful:`, result)
      return {
        printer_id: printer.id,
        success: true,
        result
      }
    } else {
      const error = await response.json()
      console.error(`❌ Direct print failed:`, error)
      return {
        printer_id: printer.id,
        success: false,
        error: error.error || `HTTP ${response.status}`
      }
    }
  } catch (error) {
    console.error(`❌ Direct print network error:`, error)
    return {
      printer_id: printer.id,
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// ================================================
// UTILITY HOOKS
// ================================================

export function usePrintJobStatus(jobId: string) {
  return useQuery({
    queryKey: [...printJobsKeys.detail(jobId), 'status'],
    queryFn: async () => {
      const job = await printJobsRepo.getPrintJob(jobId)
      return job?.status || null
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling if job is completed or failed
      if (data === 'completed' || data === 'failed' || data === 'cancelled') {
        return false
      }
      return 5000 // Poll every 5 seconds while processing
    },
  })
}



