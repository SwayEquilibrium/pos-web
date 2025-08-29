/**
 * React hooks for printer management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as printersRepo from '@/lib/repos/printers.repo'

// ================================================
// PRINTERS HOOK - PRINTER MANAGEMENT
// ================================================

// Query keys
const printerKeys = {
  all: ['printers'] as const,
  lists: () => [...printerKeys.all, 'list'] as const,
  list: (filters: string) => [...printerKeys.lists(), { filters }] as const,
  details: () => [...printerKeys.all, 'detail'] as const,
  detail: (id: string) => [...printerKeys.details(), id] as const,
  jobs: (printerId?: string) => [...printerKeys.all, 'jobs', printerId] as const,
  status: (printerId: string) => [...printerKeys.all, 'status', printerId] as const,
  summary: () => [...printerKeys.all, 'summary'] as const,
}

// ================================================
// PRINTERS
// ================================================

export function usePrinters() {
  return useQuery({
    queryKey: printerKeys.list('all'),
    queryFn: printersRepo.getPrinters,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePrinter(printerId: string) {
  return useQuery({
    queryKey: printerKeys.detail(printerId),
    queryFn: () => printersRepo.getPrinter(printerId),
    enabled: !!printerId,
    staleTime: 30 * 1000,
  })
}

export function useCreatePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.createPrinter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
    },
  })
}

export function useUpdatePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<printersRepo.Printer> }) =>
      printersRepo.updatePrinter(id, updates),
    onSuccess: (printer, { id }) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
    },
  })
}

export function useDeletePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.deletePrinter,
    onSuccess: (_, printerId) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
      queryClient.removeQueries({ queryKey: printerKeys.detail(printerId) })
    },
  })
}

export function useUpdatePrinterHeartbeat() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.updatePrinterHeartbeat,
    onSuccess: (_, printerId) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.detail(printerId) })
      queryClient.invalidateQueries({ queryKey: printerKeys.status(printerId) })
    },
  })
}

// ================================================
// PRINT JOBS
// ================================================

export function usePrintJobs(printerId?: string) {
  return useQuery({
    queryKey: printerKeys.jobs(printerId),
    queryFn: () => printersRepo.getPrintJobs(printerId),
    staleTime: 15 * 1000, // 15 seconds for print jobs
  })
}

export function usePrintJob(jobId: string) {
  return useQuery({
    queryKey: [...printerKeys.all, 'job', jobId],
    queryFn: () => printersRepo.getPrintJob(jobId),
    enabled: !!jobId,
    staleTime: 15 * 1000,
  })
}

export function useEnqueuePrintJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.enqueuePrintJob,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: printerKeys.summary() })
    },
  })
}

export function useUpdatePrintJobStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ jobId, status, errorMessage }: {
      jobId: string
      status: printersRepo.PrintJob['status']
      errorMessage?: string
    }) => printersRepo.updatePrintJobStatus(jobId, status, errorMessage),
    onSuccess: (_, { jobId }) => {
      // Get the job to find its printer_id for invalidation
      const job = queryClient.getQueryData([...printerKeys.all, 'job', jobId]) as printersRepo.PrintJob
      if (job?.printer_id) {
        queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
        queryClient.invalidateQueries({ queryKey: printerKeys.status(job.printer_id) })
      }
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: printerKeys.summary() })
    },
  })
}

export function useCancelPrintJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.cancelPrintJob,
    onSuccess: (_, jobId) => {
      // Get the job to find its printer_id for invalidation
      const job = queryClient.getQueryData([...printerKeys.all, 'job', jobId]) as printersRepo.PrintJob
      if (job?.printer_id) {
        queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
        queryClient.invalidateQueries({ queryKey: printerKeys.status(job.printer_id) })
      }
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: printerKeys.summary() })
    },
  })
}

export function useRetryPrintJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: printersRepo.retryPrintJob,
    onSuccess: (_, jobId) => {
      // Get the job to find its printer_id for invalidation
      const job = queryClient.getQueryData([...printerKeys.all, 'job', jobId]) as printersRepo.PrintJob
      if (job?.printer_id) {
        queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
        queryClient.invalidateQueries({ queryKey: printerKeys.status(job.printer_id) })
      }
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: printerKeys.summary() })
    },
  })
}

// ================================================
// PRINTER STATUS & MONITORING
// ================================================

export function usePrinterStatus(printerId: string) {
  return useQuery({
    queryKey: printerKeys.status(printerId),
    queryFn: () => printersRepo.getPrinterStatus(printerId),
    enabled: !!printerId,
    staleTime: 10 * 1000, // 10 seconds for status
  })
}

export function usePrintingSummary() {
  return useQuery({
    queryKey: printerKeys.summary(),
    queryFn: printersRepo.getPrintingSummary,
    staleTime: 30 * 1000,
  })
}

// ================================================
// AUTO-PRINTING
// ================================================

export function useAutoPrintPrinters(context: 'payment' | 'order') {
  return useQuery({
    queryKey: [...printerKeys.all, 'auto-print', context],
    queryFn: () => printersRepo.getAutoPrintPrinters(context),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAutoPrintReceipt() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ context, data }: {
      context: 'payment' | 'order'
      data: {
        orderId: string
        orderNumber: string
        totalAmount: number
        items: Array<{
          name: string
          quantity: number
          unitPrice: number
          totalPrice: number
        }>
        paymentMethod?: string
        receiptType?: string
      }
    }) => printersRepo.autoPrintReceipt(context, data),
    onSuccess: (jobs) => {
      // Invalidate print jobs for all affected printers
      jobs.forEach(job => {
        queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
        queryClient.invalidateQueries({ queryKey: printerKeys.status(job.printer_id) })
      })
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: printerKeys.summary() })
    },
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export function usePrinterByName(name: string) {
  return useQuery({
    queryKey: [...printerKeys.all, 'name', name],
    queryFn: () => printersRepo.getPrinterByName(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePrintersByType(type: printersRepo.Printer['type']) {
  return useQuery({
    queryKey: [...printerKeys.all, 'type', type],
    queryFn: () => printersRepo.getPrintersByType(type),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePrintersByConnectionType(connectionType: printersRepo.Printer['connection_type']) {
  return useQuery({
    queryKey: [...printerKeys.all, 'connection', connectionType],
    queryFn: () => printersRepo.getPrintersByConnectionType(connectionType),
    staleTime: 5 * 60 * 1000,
  })
}

// ================================================
// PRINTER OPERATIONS
// ================================================

export function usePrinterOperations(printerId: string) {
  const printer = usePrinter(printerId)
  const status = usePrinterStatus(printerId)
  const jobs = usePrintJobs(printerId)
  
  const operations = {
    canEdit: true,
    canDelete: !jobs.data?.some(job => job.status === 'QUEUED'),
    canTest: true,
    canConfigure: true,
    isOnline: status.data?.status === 'online',
    hasPendingJobs: jobs.data?.some(job => job.status === 'QUEUED') || false,
    pendingJobCount: jobs.data?.filter(job => job.status === 'QUEUED').length || 0,
  }
  
  return {
    printer: printer.data,
    status: status.data,
    jobs: jobs.data || [],
    operations,
    isLoading: printer.isLoading || status.isLoading || jobs.isLoading,
    error: printer.error || status.error || jobs.error,
  }
}

// ================================================
// PRINTER SEARCH & FILTERING
// ================================================

export function usePrinterSearch(query: string, type?: printersRepo.Printer['type']) {
  const printers = type ? usePrintersByType(type) : usePrinters()
  
  if (!query.trim()) {
    return {
      ...printers,
      data: printers.data || [],
    }
  }
  
  const filteredData = printers.data?.filter(printer =>
    printer.name.toLowerCase().includes(query.toLowerCase()) ||
    printer.model?.toLowerCase().includes(query.toLowerCase()) ||
    printer.vendor?.toLowerCase().includes(query.toLowerCase())
  ) || []
  
  return {
    ...printers,
    data: filteredData,
  }
}

// ================================================
// PRINTER ANALYTICS
// ================================================

export function usePrinterAnalytics() {
  const printers = usePrinters()
  const summary = usePrintingSummary()
  
  const analytics = {
    totalPrinters: printers.data?.length || 0,
    onlinePrinters: 0, // Would need to check status for each printer
    offlinePrinters: 0,
    totalJobs: summary.data?.total || 0,
    byStatus: summary.data?.byStatus || {},
    byPrinter: summary.data?.byPrinter || {},
    averageJobsPerPrinter: printers.data?.length ? 
      (summary.data?.total || 0) / printers.data.length : 0,
  }
  
  return {
    ...printers,
    ...summary,
    analytics,
  }
}

// ================================================
// PRINTER HEALTH MONITORING
// ================================================

export function usePrinterHealth() {
  const printers = usePrinters()
  
  const health = {
    total: printers.data?.length || 0,
    online: 0,
    offline: 0,
    error: 0,
    byType: printers.data?.reduce((acc, printer) => {
      acc[printer.type] = (acc[printer.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
    byConnection: printers.data?.reduce((acc, printer) => {
      acc[printer.connection_type] = (acc[printer.connection_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
  }
  
  return {
    ...printers,
    health,
  }
}

// ================================================
// REAL-TIME UPDATES (if using Supabase realtime)
// ================================================

export function usePrinterRealtime(printerId?: string) {
  // This would integrate with Supabase realtime subscriptions
  // For now, we'll use polling with shorter stale times
  
  const printers = printerId ? usePrinter(printerId) : usePrinters()
  const jobs = printerId ? usePrintJobs(printerId) : usePrintJobs()
  const summary = usePrintingSummary()
  
  // Refresh data more frequently for real-time feel
  const refreshInterval = 5000 // 5 seconds for printers
  
  return {
    printers: {
      ...printers,
      refetchInterval: refreshInterval,
    },
    jobs: {
      ...jobs,
      refetchInterval: refreshInterval,
    },
    summary: {
      ...summary,
      refetchInterval: refreshInterval * 2, // 10 seconds for summary
    },
  }
}

// ================================================
// PRINTER TESTING
// ================================================

export function useTestPrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (printerId: string) => {
      // Send a test print job
      const testPayload = `
================================
PRINTER TEST PAGE
================================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Printer ID: ${printerId}
================================
This is a test print to verify
printer connectivity and settings.
================================
      `.trim()
      
      return printersRepo.enqueuePrintJob({
        printerId,
        payload: testPayload,
        contentType: 'text/plain',
        receiptType: 'test'
      })
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.jobs(job.printer_id) })
      queryClient.invalidateQueries({ queryKey: printerKeys.status(job.printer_id) })
    },
  })
}

// Helper function to print to a specific printer using the working CloudPRNT system
async function printToPrinter(printer: printersRepo.Printer, orderData: any) {
  console.log(`🖨️ Printing to ${printer.display_name} (${printer.connection_string})`)
  
  try {
    // Use the working CloudPRNT system that was already working
    const response = await fetch('/api/cloudprnt/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerId: printer.name, // Use printer name as ID
        payload: buildSimpleReceipt(orderData), // Build simple receipt content
        contentType: 'text/plain',
        orderId: orderData.orderId,
        receiptType: 'kitchen'
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Successfully queued print job for ${printer.display_name}:`, result)
      return { success: true, message: `Print job queued: ${result.jobId}` }
    } else {
      const error = await response.json()
      console.log(`❌ Failed to queue print job for ${printer.display_name}:`, error)
      return { success: false, message: error.error || 'Failed to queue print job', error: error.error }
    }
    
  } catch (error) {
    console.log(`❌ Network error with ${printer.display_name}:`, error)
    return { success: false, message: 'Network error', error: error.message }
  }
}

// Simple receipt builder function
function buildSimpleReceipt(orderData: any): string {
  const lines = [
    '*** KITCHEN ORDER ***',
    '',
    `Order: ${orderData.orderNumber || orderData.orderId || 'Unknown'}`,
    `Table: ${orderData.tableName || 'Unknown'}`,
    `Time: ${new Date().toLocaleString('da-DK')}`,
    '',
    '--- ITEMS ---',
    ''
  ]
  
  // Add items
  if (orderData.items && orderData.items.length > 0) {
    orderData.items.forEach((item: any) => {
      lines.push(`${item.quantity}x ${item.name}`)
      if (item.specialInstructions) {
        lines.push(`   Note: ${item.specialInstructions}`)
      }
      lines.push('')
    })
  }
  
  lines.push('--- END ---')
  lines.push('')
  lines.push('Please prepare this order')
  lines.push('Thank you!')
  lines.push('')
  lines.push('')
  lines.push('')
  
  return lines.join('\n')
}
