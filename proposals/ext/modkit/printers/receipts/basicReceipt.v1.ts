/**
 * Basic Receipt Builder v1.0
 * 
 * Formats simple kitchen receipts and customer receipts with consistent layout.
 */

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
  modifiers?: string[]
  productType?: string
}

export interface BusinessInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  taxNumber?: string
}

export interface ReceiptOptions {
  /** Receipt type affects formatting */
  type: 'kitchen' | 'customer'
  /** Table number or takeaway order ID */
  orderReference: string
  /** Customer name for takeaway orders */
  customerName?: string
  /** Additional header text */
  headerText?: string
  /** Footer text (e.g., "Thank you!") */
  footerText?: string
  /** Paper width in characters */
  paperWidth?: number
  /** Include prices on kitchen receipts */
  showPricesOnKitchen?: boolean
  /** Business information for customer receipts */
  businessInfo?: BusinessInfo
  /** Payment information for customer receipts */
  paymentInfo?: {
    method: string
    amount: number
    change?: number
    tip?: number
  }
}

/**
 * Format a line with padding to fit paper width
 */
function formatLine(left: string, right: string = '', width: number = 48): string {
  const totalLength = left.length + right.length
  if (totalLength >= width) {
    return left.substring(0, width)
  }
  
  const padding = ' '.repeat(width - totalLength)
  return left + padding + right
}

/**
 * Create a separator line
 */
function createSeparator(width: number = 48, char: string = '-'): string {
  return char.repeat(width)
}

/**
 * Build a basic receipt from order data
 */
export function buildBasicReceipt(
  items: ReceiptItem[],
  options: ReceiptOptions
): string[] {
  const {
    type,
    orderReference,
    customerName,
    headerText,
    footerText,
    paperWidth = 48,
    showPricesOnKitchen = false,
    businessInfo,
    paymentInfo
  } = options

  const lines: string[] = []
  const isKitchen = type === 'kitchen'
  const showPrices = !isKitchen || showPricesOnKitchen

  // Business header (customer receipts only)
  if (!isKitchen && businessInfo) {
    lines.push('')
    lines.push(businessInfo.name.toUpperCase())
    if (businessInfo.address) {
      lines.push(businessInfo.address)
    }
    if (businessInfo.phone) {
      lines.push(`Tel: ${businessInfo.phone}`)
    }
    if (businessInfo.email) {
      lines.push(businessInfo.email)
    }
    if (businessInfo.taxNumber) {
      lines.push(`Tax ID: ${businessInfo.taxNumber}`)
    }
    lines.push('')
    lines.push(createSeparator(paperWidth))
  }

  // Header
  if (headerText) {
    lines.push(headerText.toUpperCase())
  } else {
    lines.push(isKitchen ? 'KITCHEN ORDER' : 'RECEIPT')
  }
  
  lines.push(createSeparator(paperWidth))
  
  // Order info
  lines.push(formatLine('Order:', orderReference, paperWidth))
  if (customerName) {
    lines.push(formatLine('Customer:', customerName, paperWidth))
  }
  lines.push(formatLine('Date:', new Date().toLocaleDateString(), paperWidth))
  lines.push(formatLine('Time:', new Date().toLocaleTimeString(), paperWidth))
  
  if (isKitchen) {
    lines.push(formatLine('Type:', 'KITCHEN COPY', paperWidth))
  }
  
  lines.push(createSeparator(paperWidth))
  lines.push('')

  // Items
  let total = 0
  
  items.forEach(item => {
    const itemTotal = item.quantity * item.price
    total += itemTotal

    if (isKitchen) {
      // Kitchen format: focus on preparation details
      lines.push(`${item.quantity}x ${item.name}`)
      
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          lines.push(`  + ${modifier}`)
        })
      }
      
      if (item.productType) {
        lines.push(`  [${item.productType.toUpperCase()}]`)
      }
      
      if (showPricesOnKitchen) {
        lines.push(formatLine('', `$${itemTotal.toFixed(2)}`, paperWidth))
      }
      
    } else {
      // Customer format: clear pricing
      const itemLine = formatLine(
        `${item.quantity}x ${item.name}`,
        showPrices ? `$${itemTotal.toFixed(2)}` : '',
        paperWidth
      )
      lines.push(itemLine)
      
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          lines.push(`  + ${modifier}`)
        })
      }
    }
    
    lines.push('')
  })

  // Totals (customer receipts only, or kitchen if prices shown)
  if (showPrices) {
    lines.push(createSeparator(paperWidth))
    lines.push(formatLine('SUBTOTAL:', `$${total.toFixed(2)}`, paperWidth))
    
    // Payment information (customer receipts only)
    if (!isKitchen && paymentInfo) {
      if (paymentInfo.tip && paymentInfo.tip > 0) {
        lines.push(formatLine('Tip:', `$${paymentInfo.tip.toFixed(2)}`, paperWidth))
        lines.push(formatLine('TOTAL:', `$${(total + paymentInfo.tip).toFixed(2)}`, paperWidth))
      } else {
        lines.push(formatLine('TOTAL:', `$${total.toFixed(2)}`, paperWidth))
      }
      
      lines.push('')
      lines.push(formatLine('Payment:', paymentInfo.method, paperWidth))
      lines.push(formatLine('Amount Paid:', `$${paymentInfo.amount.toFixed(2)}`, paperWidth))
      
      if (paymentInfo.change && paymentInfo.change > 0) {
        lines.push(formatLine('Change:', `$${paymentInfo.change.toFixed(2)}`, paperWidth))
      }
    } else {
      lines.push(formatLine('TOTAL:', `$${total.toFixed(2)}`, paperWidth))
    }
    
    lines.push('')
  }

  // Footer
  if (footerText) {
    lines.push(footerText)
  } else if (!isKitchen) {
    lines.push('Thank you for your order!')
    lines.push('Please come again!')
  }

  return lines
}

/**
 * Build a simple test receipt
 */
export function buildTestReceipt(paperWidth: number = 48): string[] {
  return [
    'PRINTER TEST',
    createSeparator(paperWidth),
    formatLine('Date:', new Date().toLocaleDateString(), paperWidth),
    formatLine('Time:', new Date().toLocaleTimeString(), paperWidth),
    createSeparator(paperWidth),
    'Test successful!',
    'Printer is working correctly.',
    '',
    'Star mC-Print2 WebPRNT'
  ]
}

/**
 * Build kitchen receipt for specific product types
 */
export function buildKitchenReceiptByType(
  items: ReceiptItem[],
  productType: string,
  orderReference: string,
  paperWidth: number = 48
): string[] {
  // Filter items by product type
  const filteredItems = items.filter(item => 
    item.productType?.toLowerCase() === productType.toLowerCase()
  )

  if (filteredItems.length === 0) {
    return [] // No items of this type
  }

  return buildBasicReceipt(filteredItems, {
    type: 'kitchen',
    orderReference,
    headerText: `${productType.toUpperCase()} ORDER`,
    paperWidth,
    showPricesOnKitchen: false
  })
}

/**
 * Build receipt for table orders
 */
export function buildTableReceipt(
  items: ReceiptItem[],
  tableNumber: string,
  receiptType: 'kitchen' | 'customer' = 'customer',
  paperWidth: number = 48
): string[] {
  return buildBasicReceipt(items, {
    type: receiptType,
    orderReference: `Table ${tableNumber}`,
    paperWidth,
    showPricesOnKitchen: false
  })
}

/**
 * Build receipt for takeaway orders
 */
export function buildTakeawayReceipt(
  items: ReceiptItem[],
  orderNumber: string,
  customerName: string,
  receiptType: 'kitchen' | 'customer' = 'customer',
  paperWidth: number = 48
): string[] {
  return buildBasicReceipt(items, {
    type: receiptType,
    orderReference: `#${orderNumber}`,
    customerName,
    headerText: receiptType === 'kitchen' ? 'TAKEAWAY ORDER' : 'TAKEAWAY RECEIPT',
    paperWidth,
    showPricesOnKitchen: false
  })
}
