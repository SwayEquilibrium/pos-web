/**
 * Customer Receipt Printing Hook v1.0
 * 
 * Handles printing customer receipts when payments are made
 */

import { flags } from '@/src/config/flags'

export interface CustomerReceiptData {
  orderId: string
  orderType: 'dine_in' | 'takeaway'
  tableId?: string | null
  customerName?: string
  items: Array<{
    product_id: string
    name: string
    qty: number
    unit_price: number
    modifiers?: Array<{
      modifier_name: string
      price_adjustment: number
    }>
  }>
  paymentDetails: {
    method: string
    amount: number
    change?: number
    tip?: number
    cashReceived?: number
  }
  businessInfo?: {
    name: string
    address?: string
    phone?: string
    email?: string
    taxNumber?: string
  }
}

/**
 * Print customer receipt after payment
 */
export async function printCustomerReceipt(receiptData: CustomerReceiptData) {
  if (!flags.printerCloudPRNTV1) {
    console.log('Customer receipt printing disabled - CloudPRNT flag not set')
    return
  }

  try {
    console.log('🧾 Printing customer receipt for order:', receiptData.orderId)

    const ESC = String.fromCharCode(27)
    const GS = String.fromCharCode(29)

    // Build customer receipt with business info
    const businessInfo = receiptData.businessInfo || {
      name: 'Your Restaurant',
      address: '123 Main Street',
      phone: '(555) 123-4567',
      email: 'info@restaurant.com'
    }

    // Calculate totals
    const subtotal = receiptData.items.reduce((sum, item) => {
      const itemTotal = item.qty * item.unit_price
      const modifierTotal = (item.modifiers || []).reduce((modSum, mod) => modSum + mod.price_adjustment, 0)
      return sum + itemTotal + modifierTotal
    }, 0)

    const tip = receiptData.paymentDetails.tip || 0
    const total = subtotal + tip

    const customerReceipt = [
      ESC + '@',  // Initialize printer
      '\n',
      `      ${businessInfo.name.toUpperCase()}\n`,
      businessInfo.address ? `   ${businessInfo.address}\n` : '',
      businessInfo.phone ? `    Tel: ${businessInfo.phone}\n` : '',
      businessInfo.email ? `  ${businessInfo.email}\n` : '',
      businessInfo.taxNumber ? `  Tax ID: ${businessInfo.taxNumber}\n` : '',
      '\n',
      '--------------------------------\n',
      '            RECEIPT\n',
      '--------------------------------\n',
      
      // Order info
      `Order: ${receiptData.orderType === 'dine_in' 
        ? `Table ${receiptData.tableId || 'Unknown'}`
        : `#${receiptData.orderId.slice(-6).toUpperCase()}`}\n`,
      receiptData.customerName ? `Customer: ${receiptData.customerName}\n` : '',
      `Date: ${new Date().toLocaleDateString()}\n`,
      `Time: ${new Date().toLocaleTimeString()}\n`,
      '--------------------------------\n',
      '\n',
      
      // Items
      ...receiptData.items.flatMap(item => {
        const itemTotal = item.qty * item.unit_price
        const modifierTotal = (item.modifiers || []).reduce((sum, mod) => sum + mod.price_adjustment, 0)
        const finalItemTotal = itemTotal + modifierTotal
        
        const lines = [
          `${item.qty}x ${item.name}${' '.repeat(Math.max(1, 32 - item.name.length - item.qty.toString().length - 1))}$${finalItemTotal.toFixed(2)}\n`
        ]
        
        // Add modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(modifier => {
            lines.push(`  + ${modifier.modifier_name}${modifier.price_adjustment !== 0 ? ` (+$${modifier.price_adjustment.toFixed(2)})` : ''}\n`)
          })
        }
        
        return lines
      }),
      
      '\n',
      '--------------------------------\n',
      `SUBTOTAL:${' '.repeat(17)}$${subtotal.toFixed(2)}\n`,
      
      // Tip if present
      ...(tip > 0 ? [
        `Tip:${' '.repeat(23)}$${tip.toFixed(2)}\n`,
        `TOTAL:${' '.repeat(20)}$${total.toFixed(2)}\n`
      ] : [
        `TOTAL:${' '.repeat(20)}$${subtotal.toFixed(2)}\n`
      ]),
      
      '\n',
      `Payment: ${receiptData.paymentDetails.method}\n`,
      `Amount Paid:${' '.repeat(13)}$${receiptData.paymentDetails.amount.toFixed(2)}\n`,
      
      // Change if present
      ...(receiptData.paymentDetails.change && receiptData.paymentDetails.change > 0 ? [
        `Change:${' '.repeat(19)}$${receiptData.paymentDetails.change.toFixed(2)}\n`
      ] : []),
      
      '\n',
      'Thank you for your order!\n',
      'Please come again!\n',
      '\n\n\n',
      
      // Use the WORKING cut command
      ESC + 'd' + String.fromCharCode(1) // ESC d 1 - WORKING partial cut!
    ].join('')

    // Send to CloudPRNT
    const response = await fetch('/api/cloudprnt/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerId: 'tsp100-kitchen', // Same printer for now
        payload: customerReceipt,
        contentType: 'application/vnd.star.starprnt',
        orderId: receiptData.orderId,
        receiptType: 'customer-receipt'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Customer receipt printed successfully, Job ID:', result.jobId)
    } else {
      const error = await response.text()
      console.error('❌ Customer receipt failed:', error)
      throw new Error(`Customer receipt printing failed: ${error}`)
    }

  } catch (error) {
    console.error('❌ Customer receipt printing failed:', error)
    throw error
  }
}
