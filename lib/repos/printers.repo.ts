import { supabase } from '@/lib/supabaseClient'

// ================================================
// PRINTERS REPOSITORY - PRINTER MANAGEMENT
// ================================================

// Types
export interface Printer {
  id: string
  name: string
  type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix'
  connection_type: 'usb' | 'network' | 'bluetooth' | 'cloudprnt' | 'webprnt'
  ip_address?: string
  port?: number
  mac_address?: string
  cloudprnt_url?: string
  webprnt_url?: string
  model?: string
  vendor?: string
  auto_print_on_payment: boolean
  auto_print_on_order: boolean
  receipt_template?: string
  paper_width: number
  active: boolean
  last_heartbeat?: string
  created_at: string
  updated_at: string
}

export interface PrintJob {
  id: string
  printer_id: string
  payload: string
  content_type: string
  order_id?: string
  receipt_type?: string
  status: 'QUEUED' | 'PROCESSING' | 'DELIVERED' | 'PRINTED' | 'FAILED' | 'CANCELLED'
  error_message?: string
  created_at: string
  delivered_at?: string
  printed_at?: string
  updated_at: string
}

export interface PrinterStatus {
  printer: Printer
  recentJobs: PrintJob[]
  status: 'online' | 'offline' | 'error'
  lastActivity?: string
}

// ================================================
// PRINTERS
// ================================================

export async function getPrinters(): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('active', true)
    .order('name')
  
  if (error) {
    console.error('[getPrinters] Query error:', error)
    throw new Error(`Failed to fetch printers: ${error.message}`)
  }
  
  return data || []
}

export async function getPrinter(printerId: string): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('id', printerId)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('[getPrinter] Query error:', error)
    throw new Error(`Failed to fetch printer: ${error.message}`)
  }
  
  return data
}

export async function createPrinter(data: {
  name: string
  type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix'
  connection_type: 'usb' | 'network' | 'bluetooth' | 'cloudprnt' | 'webprnt'
  ip_address?: string
  port?: number
  mac_address?: string
  cloudprnt_url?: string
  webprnt_url?: string
  model?: string
  vendor?: string
  auto_print_on_payment?: boolean
  auto_print_on_order?: boolean
  receipt_template?: string
  paper_width?: number
}): Promise<Printer> {
  const { 
    name, 
    type, 
    connection_type, 
    ip_address, 
    port, 
    mac_address,
    cloudprnt_url,
    webprnt_url,
    model,
    vendor,
    auto_print_on_payment = false,
    auto_print_on_order = false,
    receipt_template,
    paper_width = 80
  } = data
  
  if (!name || !type || !connection_type) {
    throw new Error('Name, type, and connection type are required')
  }
  
  const { data: printer, error } = await supabase
    .from('printers')
    .insert({
      name,
      type,
      connection_type,
      ip_address,
      port,
      mac_address,
      cloudprnt_url,
      webprnt_url,
      model,
      vendor,
      auto_print_on_payment,
      auto_print_on_order,
      receipt_template,
      paper_width,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[createPrinter] Insert error:', error)
    throw new Error(`Failed to create printer: ${error.message}`)
  }
  
  return printer
}

export async function updatePrinter(id: string, updates: Partial<Printer>): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updatePrinter] Update error:', error)
    throw new Error(`Failed to update printer: ${error.message}`)
  }
  
  return data
}

export async function deletePrinter(id: string): Promise<void> {
  // Check if printer has pending jobs
  const { data: pendingJobs } = await supabase
    .from('print_jobs')
    .select('id')
    .eq('printer_id', id)
    .eq('status', 'QUEUED')
    .limit(1)
  
  if (pendingJobs && pendingJobs.length > 0) {
    throw new Error('Cannot delete printer with pending jobs')
  }
  
  // Soft delete the printer
  const { error } = await supabase
    .from('printers')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('[deletePrinter] Delete error:', error)
    throw new Error(`Failed to delete printer: ${error.message}`)
  }
}

export async function updatePrinterHeartbeat(printerId: string): Promise<void> {
  const { error } = await supabase
    .from('printers')
    .update({ 
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', printerId)
  
  if (error) {
    console.error('[updatePrinterHeartbeat] Update error:', error)
    throw new Error(`Failed to update printer heartbeat: ${error.message}`)
  }
}

// ================================================
// PRINT JOBS
// ================================================

export async function getPrintJobs(printerId?: string): Promise<PrintJob[]> {
  let query = supabase
    .from('print_jobs')
    .select('id, printer_id, status, content_type, created_at, delivered_at, printed_at, receipt_type')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (printerId) {
    query = query.eq('printer_id', printerId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('[getPrintJobs] Query error:', error)
    throw new Error(`Failed to fetch print jobs: ${error.message}`)
  }
  
  return data || []
}

export async function getPrintJob(jobId: string): Promise<PrintJob> {
  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  if (error) {
    console.error('[getPrintJob] Query error:', error)
    throw new Error(`Failed to fetch print job: ${error.message}`)
  }
  
  return data
}

export async function enqueuePrintJob(data: {
  printerId: string
  payload: string
  contentType?: string
  orderId?: string
  receiptType?: string
}): Promise<PrintJob> {
  const { printerId, payload, contentType = 'text/plain', orderId, receiptType } = data
  
  if (!printerId || !payload) {
    throw new Error('Printer ID and payload are required')
  }
  
  if (typeof payload !== 'string') {
    throw new Error('Payload must be a string')
  }
  
  // Check if printer exists and is active
  const { data: printer, error: printerError } = await supabase
    .from('printers')
    .select('id, name, active')
    .eq('id', printerId)
    .eq('active', true)
    .single()
  
  if (printerError || !printer) {
    throw new Error('Printer not found or inactive')
  }
  
  // Encode payload as Base64 if it contains ESC/POS commands
  let encodedPayload = payload
  let isBase64 = false
  
  if (payload.includes(String.fromCharCode(27)) || payload.includes(String.fromCharCode(29))) {
    encodedPayload = btoa(payload)
    isBase64 = true
  }
  
  // Insert the print job
  const { data: job, error } = await supabase
    .from('print_jobs')
    .insert({
      printer_id: printerId,
      payload: encodedPayload,
      content_type: contentType,
      order_id: orderId || null,
      receipt_type: receiptType ? (isBase64 ? `${receiptType}:base64` : receiptType) : (isBase64 ? 'base64' : null),
      status: 'QUEUED'
    })
    .select()
    .single()
  
  if (error) {
    console.error('[enqueuePrintJob] Insert error:', error)
    throw new Error(`Failed to enqueue print job: ${error.message}`)
  }
  
  return job
}

export async function updatePrintJobStatus(jobId: string, status: PrintJob['status'], errorMessage?: string): Promise<void> {
  const updates: any = { 
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'DELIVERED') {
    updates.delivered_at = new Date().toISOString()
  } else if (status === 'PRINTED') {
    updates.printed_at = new Date().toISOString()
  }
  
  if (errorMessage) {
    updates.error_message = errorMessage
  }
  
  const { error } = await supabase
    .from('print_jobs')
    .update(updates)
    .eq('id', jobId)
  
  if (error) {
    console.error('[updatePrintJobStatus] Update error:', error)
    throw new Error(`Failed to update print job status: ${error.message}`)
  }
}

export async function cancelPrintJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('print_jobs')
    .update({ 
      status: 'CANCELLED',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .eq('status', 'QUEUED')
  
  if (error) {
    console.error('[cancelPrintJob] Update error:', error)
    throw new Error(`Failed to cancel print job: ${error.message}`)
  }
}

export async function retryPrintJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('print_jobs')
    .update({ 
      status: 'QUEUED',
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .in('status', ['FAILED', 'CANCELLED'])
  
  if (error) {
    console.error('[retryPrintJob] Update error:', error)
    throw new Error(`Failed to retry print job: ${error.message}`)
  }
}

// ================================================
// PRINTER STATUS & MONITORING
// ================================================

export async function getPrinterStatus(printerId: string): Promise<PrinterStatus> {
  const printer = await getPrinter(printerId)
  
  // Get recent print jobs for this printer
  const recentJobs = await getPrintJobs(printerId)
  
  // Determine status based on last heartbeat and recent jobs
  let status: 'online' | 'offline' | 'error' = 'online'
  let lastActivity = printer.last_heartbeat
  
  if (printer.last_heartbeat) {
    const lastHeartbeat = new Date(printer.last_heartbeat)
    const now = new Date()
    const minutesSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60)
    
    if (minutesSinceHeartbeat > 10) {
      status = 'offline'
    } else if (minutesSinceHeartbeat > 5) {
      status = 'error'
    }
  } else {
    status = 'offline'
  }
  
  // Check for recent failed jobs
  const recentFailedJobs = recentJobs.filter(job => 
    job.status === 'FAILED' && 
    new Date(job.created_at) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
  )
  
  if (recentFailedJobs.length > 0) {
    status = 'error'
  }
  
  return {
    printer,
    recentJobs: recentJobs.slice(0, 10), // Last 10 jobs
    status,
    lastActivity
  }
}

export async function getPrintingSummary(): Promise<{
  totalJobs: number
  byStatus: Record<string, number>
  byPrinter: Record<string, number>
  timestamp: string
}> {
  const { data: stats } = await supabase
    .from('print_jobs')
    .select('status, printer_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
  
  const summary = stats?.reduce((acc: any, job: any) => {
    acc.total = (acc.total || 0) + 1
    acc.byStatus = acc.byStatus || {}
    acc.byStatus[job.status] = (acc.byStatus[job.status] || 0) + 1
    acc.byPrinter = acc.byPrinter || {}
    acc.byPrinter[job.printer_id] = (acc.byPrinter[job.printer_id] || 0) + 1
    return acc
  }, {}) || {}
  
  return {
    ...summary,
    timestamp: new Date().toISOString()
  }
}

// ================================================
// AUTO-PRINTING
// ================================================

export async function getAutoPrintPrinters(context: 'payment' | 'order'): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('active', true)
    .eq(context === 'payment' ? 'auto_print_on_payment' : 'auto_print_on_order', true)
    .order('name')
  
  if (error) {
    console.error('[getAutoPrintPrinters] Query error:', error)
    throw new Error(`Failed to fetch auto-print printers: ${error.message}`)
  }
  
  return data || []
}

export async function autoPrintReceipt(context: 'payment' | 'order', data: {
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
}): Promise<PrintJob[]> {
  const { orderId, orderNumber, totalAmount, items, paymentMethod, receiptType } = data
  
  // Get printers configured for auto-printing
  const printers = await getAutoPrintPrinters(context)
  
  if (printers.length === 0) {
    console.log('No auto-print printers configured for', context)
    return []
  }
  
  // Generate receipt content
  const receiptContent = generateReceiptContent({
    orderNumber,
    totalAmount,
    items,
    paymentMethod,
    receiptType: receiptType || context
  })
  
  // Enqueue print jobs for all configured printers
  const printJobs: PrintJob[] = []
  
  for (const printer of printers) {
    try {
      const job = await enqueuePrintJob({
        printerId: printer.id,
        payload: receiptContent,
        contentType: 'text/plain',
        orderId,
        receiptType: receiptType || context
      })
      printJobs.push(job)
    } catch (error) {
      console.error(`Failed to enqueue print job for printer ${printer.name}:`, error)
    }
  }
  
  return printJobs
}

function generateReceiptContent(data: {
  orderNumber: string
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  paymentMethod?: string
  receiptType: string
}): string {
  const { orderNumber, totalAmount, items, paymentMethod, receiptType } = data
  
  let content = ''
  
  // Header
  content += '='.repeat(32) + '\n'
  content += 'RESTAURANT RECEIPT\n'
  content += '='.repeat(32) + '\n'
  content += `Order: ${orderNumber}\n`
  content += `Type: ${receiptType.toUpperCase()}\n`
  content += `Date: ${new Date().toLocaleDateString()}\n`
  content += `Time: ${new Date().toLocaleTimeString()}\n`
  content += '-'.repeat(32) + '\n'
  
  // Items
  items.forEach(item => {
    content += `${item.quantity}x ${item.name}\n`
    content += `  ${item.unitPrice.toFixed(2)} DKK each\n`
    content += `  ${item.totalPrice.toFixed(2)} DKK\n`
  })
  
  content += '-'.repeat(32) + '\n'
  content += `TOTAL: ${totalAmount.toFixed(2)} DKK\n`
  
  if (paymentMethod) {
    content += `Payment: ${paymentMethod}\n`
  }
  
  content += '='.repeat(32) + '\n'
  content += 'Thank you for your order!\n'
  content += '='.repeat(32) + '\n'
  
  return content
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export async function getPrinterByName(name: string): Promise<Printer | null> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('name', name)
    .eq('active', true)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null // No rows returned
    }
    console.error('[getPrinterByName] Query error:', error)
    throw new Error(`Failed to fetch printer by name: ${error.message}`)
  }
  
  return data
}

export async function getPrintersByType(type: Printer['type']): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('type', type)
    .eq('active', true)
    .order('name')
  
  if (error) {
    console.error('[getPrintersByType] Query error:', error)
    throw new Error(`Failed to fetch printers by type: ${error.message}`)
  }
  
  return data || []
}

export async function getPrintersByConnectionType(connectionType: Printer['connection_type']): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('connection_type', connectionType)
    .eq('active', true)
    .order('name')
  
  if (error) {
    console.error('[getPrintersByConnectionType] Query error:', error)
    throw new Error(`Failed to fetch printers by connection type: ${error.message}`)
  }
  
  return data || []
}
