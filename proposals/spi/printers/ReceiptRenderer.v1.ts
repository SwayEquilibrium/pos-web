// Receipt Renderer SPI v1.0
// Pluggable receipt generation and printing

export interface ReceiptData {
  orderId: string
  orderNumber: string
  timestamp: Date
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  
  customer?: {
    name: string
    phone?: string
    address?: string
  }
  
  items: {
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    modifiers?: {
      name: string
      price: number
    }[]
  }[]
  
  totals: {
    subtotal: number
    tax: number
    discount: number
    tip: number
    total: number
  }
  
  payment: {
    method: string
    amount: number
    change?: number
    transactionId: string
  }
  
  company: {
    name: string
    address: string
    phone: string
    cvr: string
  }
}

export interface ReceiptFormat {
  type: 'thermal' | 'a4' | 'email' | 'sms'
  width?: number // characters for thermal
  template?: string
}

export interface PrinterConfig {
  name: string
  type: 'thermal' | 'laser' | 'email' | 'sms'
  connection: 'usb' | 'network' | 'bluetooth' | 'cloud'
  address?: string // IP, email, phone number
  settings?: Record<string, any>
}

export interface ReceiptOutput {
  format: ReceiptFormat
  content: string | Buffer
  contentType: string
  size?: number
}

export interface ReceiptRenderer {
  readonly name: string
  readonly version: string
  readonly supportedFormats: ReceiptFormat[]
  
  // Rendering
  renderReceipt(data: ReceiptData, format: ReceiptFormat): Promise<ReceiptOutput>
  
  // Printing
  printReceipt(receipt: ReceiptOutput, printer: PrinterConfig): Promise<{
    success: boolean
    jobId?: string
    error?: string
  }>
  
  // Email/SMS delivery
  emailReceipt?(receipt: ReceiptOutput, email: string, subject?: string): Promise<boolean>
  smsReceipt?(receipt: ReceiptOutput, phone: string): Promise<boolean>
  
  // Template management
  getTemplates(): Promise<string[]>
  setTemplate(name: string, template: string): Promise<void>
  
  // Printer management
  discoverPrinters(): Promise<PrinterConfig[]>
  testPrinter(printer: PrinterConfig): Promise<boolean>
  
  // Configuration
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] }
}

export interface KitchenTicketData {
  orderId: string
  orderNumber: string
  timestamp: Date
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  tableNumber?: string
  customerName?: string
  
  items: {
    name: string
    quantity: number
    course: number
    modifiers?: string[]
    kitchenNotes?: string
    allergens?: string[]
  }[]
  
  specialInstructions?: string
  priority: 'normal' | 'rush' | 'vip'
}

// Kitchen ticket renderer extends base renderer
export interface KitchenTicketRenderer extends ReceiptRenderer {
  renderKitchenTicket(data: KitchenTicketData, format: ReceiptFormat): Promise<ReceiptOutput>
  printKitchenTicket(ticket: ReceiptOutput, printer: PrinterConfig): Promise<boolean>
}
