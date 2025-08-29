import { supabase } from '@/lib/supabaseClient'

// ================================================
// SIMPLE PRINTER REPOSITORY - JUST WORKS
// ================================================

export interface Printer {
  id: string
  name: string
  display_name: string
  printer_type: string
  connection_string: string
  brand: string
  paper_width: number
  supports_cut: boolean
  cut_command_hex: string
  cut_command_name: string
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  auto_print_on_order: boolean
  auto_print_on_payment: boolean
  is_active: boolean
  is_default: boolean
  last_test_at?: string
  last_test_result?: string
  created_at?: string
  updated_at?: string
}

// Get all active printers
export async function getPrinters(): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data || []
}

// Get a single printer by ID
export async function getPrinter(id: string): Promise<Printer | null> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}

// Create a new printer
export async function createPrinter(printerData: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .insert(printerData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Update a printer
export async function updatePrinter(id: string, updates: Partial<Printer>): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete a printer (soft delete)
export async function deletePrinter(id: string): Promise<void> {
  const { error } = await supabase
    .from('printers')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

// Get printers that should print on order
export async function getOrderPrinters(): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('is_active', true)
    .eq('auto_print_on_order', true)
    .order('name')
  
  if (error) throw error
  return data || []
}

// Get printers that should print on payment
export async function getPaymentPrinters(): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('is_active', true)
    .eq('auto_print_on_payment', true)
    .order('name')
  
  if (error) throw error
  return data || []
}

// Auto-print receipt for orders or payments
export async function autoPrintReceipt(
  context: 'payment' | 'order',
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
): Promise<any[]> {
  try {
    console.log(`🖨️ Auto-printing ${context} receipt for order:`, data.orderId)
    
    // Get printers configured for this context
    let printers: Printer[]
    if (context === 'order') {
      printers = await getOrderPrinters()
    } else {
      printers = await getPaymentPrinters()
    }
    
    if (printers.length === 0) {
      console.log('ℹ️ No printers configured for', context)
      return []
    }
    
    console.log(`🖨️ Found ${printers.length} printer(s) for ${context}:`, printers)
    
    // Print to each configured printer
    const printJobs = await Promise.allSettled(
      printers.map(async (printer) => {
        try {
          const printData = {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            totalAmount: data.totalAmount,
            tableName: `Order ${data.orderNumber}`, // Default table name
            items: data.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              category: 'General',
              specialInstructions: ''
            }))
          }
          
          const printType = context === 'order' ? 'kitchen' : 'receipt'
          
          // Use the working /api/print endpoint
          const response = await fetch('/api/print', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              printerIP: printer.connection_string,
              printData,
              printType
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log(`✅ Printed to ${printer.display_name}:`, result)
            return {
              printer_id: printer.id,
              success: true,
              message: `Printed successfully to ${printer.display_name}`
            }
          } else {
            const error = await response.json()
            console.error(`❌ Failed to print to ${printer.display_name}:`, error)
            return {
              printer_id: printer.id,
              success: false,
              message: error.error || 'Print failed',
              error: error.error
            }
          }
          
        } catch (error) {
          console.error(`❌ Error printing to ${printer.display_name}:`, error)
          return {
            printer_id: printer.id,
            success: false,
            message: 'Print error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    // Return successful print jobs
    const successfulJobs = printJobs
      .filter(job => job.status === 'fulfilled' && job.value.success)
      .map(job => (job as PromiseFulfilledResult<any>).value)
    
    console.log(`✅ Auto-printing completed: ${successfulJobs.length}/${printers.length} successful`)
    return successfulJobs
    
  } catch (error) {
    console.error('❌ Auto-printing failed:', error)
    throw error
  }
}

// Enqueue a print job (for testing)
export async function enqueuePrintJob(jobData: {
  printerId: string
  payload: string
  contentType: string
  receiptType: string
}): Promise<any> {
  try {
    // For now, just return a mock job since we're using direct printing
    return {
      id: `job-${Date.now()}`,
      printer_id: jobData.printerId,
      status: 'COMPLETED',
      payload: jobData.payload,
      content_type: jobData.contentType,
      receipt_type: jobData.receiptType,
      created_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Failed to enqueue print job:', error)
    throw error
  }
}
