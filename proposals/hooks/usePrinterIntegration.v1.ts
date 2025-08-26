/**
 * Printer Integration Hook v1.0
 * 
 * Integrates automatic printing with the existing order system.
 * Prints kitchen receipts when orders are created.
 */

import { useEffect } from 'react'
import { flags } from '@/src/config/flags'
import { starWebPRNTProvider } from '@/proposals/ext/modkit/printers/providers/StarWebPRNT.v1'
import { buildTableReceipt, buildTakeawayReceipt, ReceiptItem } from '@/proposals/ext/modkit/printers/receipts/basicReceipt.v1'

export interface OrderForPrinting {
  id: string
  type: 'dine_in' | 'takeaway'
  table_id?: string | null
  order_number: string
  items: Array<{
    product_id: string
    qty: number
    unit_price: number
    kitchen_note?: string
    course_no?: number
    product_name?: string
    category_name?: string
    modifiers?: Array<{
      name: string
      price?: number
    }>
  }>
  customer_name?: string
}

/**
 * Configuration for printer assignments
 */
export interface PrinterConfig {
  // Printer URLs for different types
  kitchenPrinter?: string
  barPrinter?: string
  receiptPrinter?: string
  
  // Category assignments
  foodCategories?: string[]
  drinkCategories?: string[]
  
  // Auto-print settings
  printKitchenReceipts?: boolean
  printCustomerReceipts?: boolean
  printByCategory?: boolean
}

const defaultConfig: PrinterConfig = {
  kitchenPrinter: process.env.NEXT_PUBLIC_PRINTER_URL,
  printKitchenReceipts: true,
  printCustomerReceipts: false,
  printByCategory: true,
  foodCategories: ['food', 'main', 'appetizer', 'dessert'],
  drinkCategories: ['drinks', 'beverages', 'alcohol', 'coffee']
}

/**
 * Hook to automatically print receipts when orders are created
 */
export function usePrinterIntegration(config: PrinterConfig = defaultConfig) {
  
  const printOrderReceipt = async (order: OrderForPrinting) => {
    if (!flags.printerWebPRNTV1) {
      console.log('Printer integration disabled - flag not set')
      return
    }

    try {
      console.log('Processing order for printing:', order.id)
      
      // Convert order items to receipt format
      const receiptItems: ReceiptItem[] = order.items.map(item => ({
        name: item.product_name || `Product ${item.product_id}`,
        quantity: item.qty,
        price: item.unit_price,
        modifiers: item.modifiers?.map(m => m.name) || [],
        productType: getCategoryType(item.category_name, config)
      }))

      // Print kitchen receipt if enabled
      if (config.printKitchenReceipts && config.kitchenPrinter) {
        await printKitchenReceipt(order, receiptItems, config)
      }

      // Print customer receipt if enabled
      if (config.printCustomerReceipts && config.receiptPrinter) {
        await printCustomerReceipt(order, receiptItems, config)
      }

      console.log('✅ Order printing completed for order:', order.id)

    } catch (error) {
      console.error('❌ Order printing failed:', error)
      // Don't throw - printing failures shouldn't break order creation
    }
  }

  return {
    printOrderReceipt,
    isEnabled: flags.printerWebPRNTV1
  }
}

/**
 * Print kitchen receipt for an order
 */
async function printKitchenReceipt(
  order: OrderForPrinting, 
  items: ReceiptItem[], 
  config: PrinterConfig
) {
  if (!config.kitchenPrinter) return

  let receiptLines: string[]

  if (order.type === 'dine_in') {
    const tableNumber = order.table_id || 'Unknown'
    receiptLines = buildTableReceipt(items, tableNumber, 'kitchen')
  } else {
    receiptLines = buildTakeawayReceipt(
      items, 
      order.order_number, 
      order.customer_name || 'Customer',
      'kitchen'
    )
  }

  console.log('🖨️ Printing kitchen receipt to:', config.kitchenPrinter)
  await starWebPRNTProvider.printReceipt(receiptLines, {
    url: config.kitchenPrinter,
    autoCut: true
  })
}

/**
 * Print customer receipt for an order
 */
async function printCustomerReceipt(
  order: OrderForPrinting, 
  items: ReceiptItem[], 
  config: PrinterConfig
) {
  if (!config.receiptPrinter) return

  let receiptLines: string[]

  if (order.type === 'dine_in') {
    const tableNumber = order.table_id || 'Unknown'
    receiptLines = buildTableReceipt(items, tableNumber, 'customer')
  } else {
    receiptLines = buildTakeawayReceipt(
      items, 
      order.order_number, 
      order.customer_name || 'Customer',
      'customer'
    )
  }

  console.log('🖨️ Printing customer receipt to:', config.receiptPrinter)
  await starWebPRNTProvider.printReceipt(receiptLines, {
    url: config.receiptPrinter,
    autoCut: true
  })
}

/**
 * Determine if a category is food or drinks
 */
function getCategoryType(categoryName?: string, config: PrinterConfig = defaultConfig): string {
  if (!categoryName) return 'unknown'
  
  const name = categoryName.toLowerCase()
  
  if (config.foodCategories?.some(cat => name.includes(cat.toLowerCase()))) {
    return 'food'
  }
  
  if (config.drinkCategories?.some(cat => name.includes(cat.toLowerCase()))) {
    return 'drinks'
  }
  
  return 'unknown'
}

/**
 * Hook to integrate with existing order creation
 * This can be used in the order creation success callback
 */
export function useOrderPrintingIntegration() {
  const { printOrderReceipt, isEnabled } = usePrinterIntegration()

  const handleOrderCreated = async (orderData: OrderForPrinting) => {
    if (isEnabled) {
      await printOrderReceipt(orderData)
    }
  }

  return {
    handleOrderCreated,
    isEnabled
  }
}
