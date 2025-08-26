/**
 * ESC/POS Receipt Builder v1.0
 * 
 * Formats receipts using ESC/POS commands for Star TSP100 printer.
 * Based on working format from escpos-fix tests.
 */

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
  modifiers?: string[]
  productType?: string
  categoryId?: string
  categoryName?: string
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
  /** Include prices on kitchen receipts */
  showPricesOnKitchen?: boolean
}

/**
 * ESC/POS Control Characters
 */
const ESC = String.fromCharCode(27)  // ESC character
const GS = String.fromCharCode(29)   // GS character

const ESC_POS = {
  INIT: ESC + '@',                    // Initialize printer
  CENTER: ESC + 'a' + String.fromCharCode(1),     // Center alignment
  LEFT: ESC + 'a' + String.fromCharCode(0),       // Left alignment
  DOUBLE_SIZE: ESC + '!' + String.fromCharCode(48), // Double width/height
  NORMAL_SIZE: ESC + '!' + String.fromCharCode(0),  // Normal size
  BOLD_ON: ESC + 'E' + String.fromCharCode(1),    // Bold on
  BOLD_OFF: ESC + 'E' + String.fromCharCode(0),   // Bold off
  UNDERLINE_ON: ESC + '-' + String.fromCharCode(1), // Underline on
  UNDERLINE_OFF: ESC + '-' + String.fromCharCode(0), // Underline off
  
  // Cut options for Star TSP100
  PARTIAL_CUT: GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0), // Partial cut (default)
  FULL_CUT: GS + 'V' + String.fromCharCode(65) + String.fromCharCode(0),    // Full cut
  FEED_AND_CUT: GS + 'V' + String.fromCharCode(66) + String.fromCharCode(3), // Feed 3 lines then partial cut
  
  // Current default (partial cut)
  CUT: GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0), // Partial cut
  FEED: '\n'
}

/**
 * Category ordering configuration
 * Lower numbers print first (appetizers before mains)
 */
const CATEGORY_ORDER: { [key: string]: number } = {
  // Danish categories
  'forretter': 1,
  'appetizers': 1,
  'forret': 1,
  'starter': 1,
  'starters': 1,
  
  // Main courses  
  'hovedretter': 2,
  'hovedret': 2,
  'main': 2,
  'mains': 2,
  'main course': 2,
  'main courses': 2,
  'entrees': 2,
  'kød': 2.1,
  'meat': 2.1,
  'fisk': 2.2,
  'fish': 2.2,
  'seafood': 2.2,
  'vegetar': 2.3,
  'vegetarian': 2.3,
  'vegan': 2.3,
  
  // Sides
  'tilbehør': 2.5,
  'sides': 2.5,
  'side dishes': 2.5,
  
  // Desserts
  'desserter': 3,
  'dessert': 3,
  'desserts': 3,
  'sweets': 3,
  'kage': 3,
  'cake': 3,
  
  // Beverages
  'drikkevarer': 4,
  'drinks': 4,
  'beverages': 4,
  'kaffe': 4.1,
  'coffee': 4.1,
  'te': 4.2,
  'tea': 4.2,
  'øl': 4.3,
  'beer': 4.3,
  'vin': 4.4,
  'wine': 4.4,
  'cocktails': 4.5,
  'spirits': 4.6
}

/**
 * Get category sort order (lower = prints first)
 */
function getCategoryOrder(categoryName?: string): number {
  if (!categoryName) return 999 // Unknown categories go last
  
  const normalized = categoryName.toLowerCase().trim()
  return CATEGORY_ORDER[normalized] ?? 999 // Default to last if not found
}

/**
 * Format a line with padding to fit paper width (48 chars for TSP100)
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
 * Build an ESC/POS formatted receipt from order data with smart category grouping
 */
export function buildESCPOSReceipt(
  items: ReceiptItem[],
  options: ReceiptOptions
): string {
  const {
    type,
    orderReference,
    customerName,
    headerText,
    footerText,
    showPricesOnKitchen = false
  } = options

  const isKitchen = type === 'kitchen'
  const showPrices = !isKitchen || showPricesOnKitchen
  
  let receipt = ''

  // Initialize printer
  receipt += ESC_POS.INIT

  // Header with double size and center alignment
  receipt += ESC_POS.CENTER
  receipt += ESC_POS.DOUBLE_SIZE
  
  if (headerText) {
    receipt += headerText.toUpperCase() + ESC_POS.FEED
  } else {
    receipt += (isKitchen ? '*** KITCHEN ORDER ***' : '*** RECEIPT ***') + ESC_POS.FEED
  }
  
  receipt += ESC_POS.NORMAL_SIZE
  receipt += ESC_POS.LEFT
  receipt += ESC_POS.FEED

  // Order info section
  receipt += createSeparator(48) + ESC_POS.FEED
  receipt += formatLine('Order:', orderReference) + ESC_POS.FEED
  
  if (customerName) {
    receipt += formatLine('Customer:', customerName) + ESC_POS.FEED
  }
  
  receipt += formatLine('Time:', new Date().toLocaleTimeString()) + ESC_POS.FEED
  
  if (isKitchen) {
    receipt += ESC_POS.BOLD_ON
    receipt += formatLine('Type:', 'KITCHEN COPY') + ESC_POS.FEED
    receipt += ESC_POS.BOLD_OFF
  }
  
  receipt += createSeparator(48) + ESC_POS.FEED
  receipt += ESC_POS.FEED

  // GROUP AND SORT ITEMS BY CATEGORY
  const itemsByCategory = new Map<string, ReceiptItem[]>()
  
  items.forEach(item => {
    const categoryKey = item.categoryName || 'Other Items'
    if (!itemsByCategory.has(categoryKey)) {
      itemsByCategory.set(categoryKey, [])
    }
    itemsByCategory.get(categoryKey)!.push(item)
  })

  // Sort categories by defined order
  const sortedCategories = Array.from(itemsByCategory.keys()).sort((a, b) => {
    return getCategoryOrder(a) - getCategoryOrder(b)
  })

  let total = 0
  
  // Print items grouped by category
  sortedCategories.forEach((categoryName, categoryIndex) => {
    const categoryItems = itemsByCategory.get(categoryName)!
    
    // Category header with bold and underline
    receipt += ESC_POS.BOLD_ON
    receipt += ESC_POS.UNDERLINE_ON
    receipt += categoryName.toUpperCase() + ESC_POS.FEED
    receipt += ESC_POS.UNDERLINE_OFF
    receipt += ESC_POS.BOLD_OFF
    receipt += createSeparator(48, '·') + ESC_POS.FEED // Dotted separator
    
    // Items in this category
    categoryItems.forEach(item => {
      const itemTotal = item.quantity * item.price
      total += itemTotal

      if (isKitchen) {
        // Kitchen format: focus on preparation details
        receipt += ESC_POS.BOLD_ON
        receipt += `${item.quantity}x ${item.name}` + ESC_POS.FEED
        receipt += ESC_POS.BOLD_OFF
        
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(modifier => {
            receipt += `   + ${modifier}` + ESC_POS.FEED
          })
        }
        
        if (item.productType && item.productType !== item.categoryName) {
          receipt += `   [${item.productType.toUpperCase()}]` + ESC_POS.FEED
        }
        
        if (showPricesOnKitchen) {
          receipt += formatLine('', `$${(itemTotal / 100).toFixed(2)}`) + ESC_POS.FEED
        }
        
      } else {
        // Customer format: clear pricing
        const itemLine = formatLine(
          `${item.quantity}x ${item.name}`,
          showPrices ? `$${(itemTotal / 100).toFixed(2)}` : ''
        )
        receipt += itemLine + ESC_POS.FEED
        
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(modifier => {
            receipt += `   + ${modifier}` + ESC_POS.FEED
          })
        }
      }
      
      receipt += ESC_POS.FEED
    })
    
    // Space between categories (except last one)
    if (categoryIndex < sortedCategories.length - 1) {
      receipt += ESC_POS.FEED
    }
  })

  // Totals (customer receipts only, or kitchen if prices shown)
  if (showPrices) {
    receipt += createSeparator(48) + ESC_POS.FEED
    receipt += ESC_POS.BOLD_ON
    receipt += formatLine('TOTAL:', `$${(total / 100).toFixed(2)}`) + ESC_POS.FEED
    receipt += ESC_POS.BOLD_OFF
    receipt += ESC_POS.FEED
  }

  // Footer
  if (footerText) {
    receipt += ESC_POS.CENTER
    receipt += footerText + ESC_POS.FEED
  } else if (!isKitchen) {
    receipt += ESC_POS.CENTER
    receipt += 'Thank you for your order!' + ESC_POS.FEED
  }

  receipt += ESC_POS.LEFT
  receipt += ESC_POS.FEED
  receipt += ESC_POS.FEED
  receipt += ESC_POS.FEED

  // Cut paper
  receipt += ESC_POS.CUT

  return receipt
}

/**
 * Build a simple ESC/POS test receipt
 */
export function buildESCPOSTestReceipt(): string {
  let receipt = ''

  receipt += ESC_POS.INIT
  receipt += ESC_POS.CENTER
  receipt += ESC_POS.DOUBLE_SIZE
  receipt += '*** PRINTER TEST ***' + ESC_POS.FEED
  receipt += ESC_POS.NORMAL_SIZE
  receipt += ESC_POS.LEFT
  receipt += ESC_POS.FEED

  receipt += createSeparator(48) + ESC_POS.FEED
  receipt += formatLine('Date:', new Date().toLocaleDateString()) + ESC_POS.FEED
  receipt += formatLine('Time:', new Date().toLocaleTimeString()) + ESC_POS.FEED
  receipt += createSeparator(48) + ESC_POS.FEED
  receipt += ESC_POS.FEED

  receipt += ESC_POS.CENTER
  receipt += 'Test successful!' + ESC_POS.FEED
  receipt += 'Printer is working correctly.' + ESC_POS.FEED
  receipt += ESC_POS.FEED
  receipt += 'Star TSP100 CloudPRNT' + ESC_POS.FEED

  receipt += ESC_POS.LEFT
  receipt += ESC_POS.FEED
  receipt += ESC_POS.FEED
  receipt += ESC_POS.CUT

  return receipt
}

/**
 * Build kitchen receipt for specific product types (ESC/POS)
 */
export function buildESCPOSKitchenReceiptByType(
  items: ReceiptItem[],
  productType: string,
  orderReference: string
): string {
  // Filter items by product type
  const filteredItems = items.filter(item => 
    item.productType?.toLowerCase() === productType.toLowerCase()
  )

  if (filteredItems.length === 0) {
    return '' // No items of this type
  }

  return buildESCPOSReceipt(filteredItems, {
    type: 'kitchen',
    orderReference,
    headerText: `${productType.toUpperCase()} ORDER`,
    showPricesOnKitchen: false
  })
}

/**
 * Build receipt for table orders (ESC/POS)
 */
export function buildESCPOSTableReceipt(
  items: ReceiptItem[],
  tableNumber: string,
  receiptType: 'kitchen' | 'customer' = 'customer'
): string {
  return buildESCPOSReceipt(items, {
    type: receiptType,
    orderReference: `Table ${tableNumber}`,
    showPricesOnKitchen: false
  })
}

/**
 * Build receipt for takeaway orders (ESC/POS)
 */
export function buildESCPOSTakeawayReceipt(
  items: ReceiptItem[],
  orderNumber: string,
  customerName: string,
  receiptType: 'kitchen' | 'customer' = 'customer'
): string {
  return buildESCPOSReceipt(items, {
    type: receiptType,
    orderReference: `#${orderNumber}`,
    customerName,
    headerText: receiptType === 'kitchen' ? 'TAKEAWAY ORDER' : 'TAKEAWAY RECEIPT',
    showPricesOnKitchen: false
  })
}
