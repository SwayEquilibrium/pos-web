/**
 * Customer Receipt Printing Hook
 * Integrates with payment completion to print customer receipts
 */

import { useMutation } from '@tanstack/react-query'
import { PrinterRepository } from '@/lib/repos/printer.simple.repo'

interface CustomerReceiptData {
  orderId: string
  orderType: 'dine_in' | 'takeaway'
  tableId?: string | null
  items: Array<{
    name: string
    quantity: number
    unit_price: number
    modifiers?: Array<{
      modifier_name: string
      price_adjustment: number
    }>
  }>
  paymentInfo: {
    method: string
    amount: number
    cash_received?: number
    change_given?: number
    transaction_id?: string
  }
  businessInfo?: {
    name: string
    address?: string
    phone?: string
    vat_number?: string
  }
}

export function usePrintCustomerReceipt() {
  return useMutation({
    mutationFn: async (data: CustomerReceiptData) => {
      console.log('🧾 Printing customer receipt for order:', data.orderId)

      // Get all printers that print customer receipts
      const printers = await PrinterRepository.getAllPrinters()
      const customerReceiptPrinters = printers.filter(p => p.print_customer_receipts && p.is_active)

      if (customerReceiptPrinters.length === 0) {
        console.warn('⚠️ No printers configured for customer receipts')
        return { success: false, message: 'No customer receipt printers configured' }
      }

      // Build customer receipt content
      const receiptContent = buildCustomerReceiptContent(data)

      // Print to all customer receipt printers
      const printResults = await Promise.allSettled(
        customerReceiptPrinters.map(printer => 
          printToCustomerPrinter(printer, receiptContent, data.orderId)
        )
      )

      const successCount = printResults.filter(r => r.status === 'fulfilled').length
      const totalPrinters = customerReceiptPrinters.length

      if (successCount === 0) {
        throw new Error('All customer receipt printers failed')
      }

      return {
        success: true,
        message: `Customer receipt sent to ${successCount}/${totalPrinters} printers`,
        printers_used: customerReceiptPrinters.map(p => p.display_name)
      }
    }
  })
}

/**
 * Build customer receipt content with business info and payment details
 */
function buildCustomerReceiptContent(data: CustomerReceiptData): string {
  const ESC = String.fromCharCode(27)
  const lines = []

  // Initialize printer
  lines.push(ESC + '@')
  lines.push('\n')

  // Business header
  if (data.businessInfo?.name) {
    lines.push(`${data.businessInfo.name}\n`)
    if (data.businessInfo.address) {
      lines.push(`${data.businessInfo.address}\n`)
    }
    if (data.businessInfo.phone) {
      lines.push(`Tel: ${data.businessInfo.phone}\n`)
    }
    if (data.businessInfo.vat_number) {
      lines.push(`CVR: ${data.businessInfo.vat_number}\n`)
    }
    lines.push('--------------------------------\n')
  }

  // Receipt header
  lines.push('*** CUSTOMER RECEIPT ***\n')
  lines.push('--------------------------------\n')

  // Order info
  const orderRef = data.orderType === 'dine_in' 
    ? `Table ${data.tableId || 'Unknown'}` 
    : `Takeaway #${data.orderId.slice(-6).toUpperCase()}`
  
  lines.push(`Order: ${orderRef}\n`)
  lines.push(`Date: ${new Date().toLocaleDateString()}\n`)
  lines.push(`Time: ${new Date().toLocaleTimeString()}\n`)
  lines.push('--------------------------------\n')
  lines.push('\n')

  // Items
  let subtotal = 0
  data.items.forEach(item => {
    const itemTotal = item.unit_price * item.quantity
    subtotal += itemTotal
    
    lines.push(`${item.quantity}x ${item.name}\n`)
    lines.push(`    ${formatCurrency(item.unit_price)} ea = ${formatCurrency(itemTotal)}\n`)
    
    // Modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(mod => {
        if (mod.price_adjustment !== 0) {
          lines.push(`  + ${mod.modifier_name}\n`)
          lines.push(`    ${formatCurrency(mod.price_adjustment)}\n`)
          subtotal += mod.price_adjustment * item.quantity
        } else {
          lines.push(`  + ${mod.modifier_name}\n`)
        }
      })
    }
    lines.push('\n')
  })

  // Totals
  lines.push('--------------------------------\n')
  lines.push(`Subtotal:     ${formatCurrency(subtotal)}\n`)
  
  // Tax calculation (assuming 25% Danish VAT)
  const taxRate = 0.25
  const taxAmount = subtotal * taxRate / (1 + taxRate)
  const netAmount = subtotal - taxAmount
  
  lines.push(`Net (ex VAT): ${formatCurrency(netAmount)}\n`)
  lines.push(`VAT (25%):    ${formatCurrency(taxAmount)}\n`)
  lines.push(`TOTAL:        ${formatCurrency(data.paymentInfo.amount)}\n`)
  lines.push('--------------------------------\n')

  // Payment details
  lines.push(`Payment: ${data.paymentInfo.method}\n`)
  if (data.paymentInfo.cash_received) {
    lines.push(`Cash Received: ${formatCurrency(data.paymentInfo.cash_received)}\n`)
    if (data.paymentInfo.change_given) {
      lines.push(`Change Given:  ${formatCurrency(data.paymentInfo.change_given)}\n`)
    }
  }
  if (data.paymentInfo.transaction_id) {
    lines.push(`Transaction: ${data.paymentInfo.transaction_id}\n`)
  }
  lines.push('--------------------------------\n')
  lines.push('\n')

  // Footer
  lines.push('Thank you for your visit!\n')
  lines.push('Have a great day!\n')
  lines.push('\n')
  lines.push('--------------------------------\n')
  lines.push(`Receipt: ${data.orderId.slice(-8).toUpperCase()}\n`)
  lines.push(`Printed: ${new Date().toLocaleString()}\n`)
  lines.push('\n\n')

  return lines.join('')
}

/**
 * Print to a specific customer receipt printer
 */
async function printToCustomerPrinter(
  printer: any, 
  content: string, 
  orderId: string
): Promise<void> {
  // Add the printer's cut command
  const cutCommand = PrinterRepository.getCutCommandString(printer.cut_command_hex)
  const finalContent = content + cutCommand

  const response = await fetch('/api/cloudprnt/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      printerId: printer.name,
      payload: finalContent,
      contentType: 'application/vnd.star.starprnt',
      orderId: orderId,
      receiptType: 'customer-receipt'
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Printer ${printer.display_name} failed: ${error}`)
  }

  const result = await response.json()
  console.log(`✅ Customer receipt sent to ${printer.display_name}:`, result.jobId)
}

/**
 * Format currency for Danish kroner
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2
  }).format(amount / 100) // Convert from øre to kroner
}

/**
 * Hook to get business information for receipts
 */
export function useBusinessInfo() {
  // This could be expanded to fetch from database/settings
  return {
    name: 'Your Restaurant Name',
    address: 'Restaurant Address\nCity, Postal Code',
    phone: '+45 12 34 56 78',
    vat_number: '12345678'
  }
}
