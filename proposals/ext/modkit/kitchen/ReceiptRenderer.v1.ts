// Receipt Renderer SPI v1.0
// Pluggable receipt generation and printing system

export interface ReceiptContext {
  tenantId: string
  locationId: string
  userId: string
  correlationId: string
}

export interface ReceiptData {
  orderId: string
  orderNumber: string
  timestamp: Date
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  
  location: {
    name: string
    address: string
    phone: string
    email?: string
    website?: string
  }
  
  customer?: {
    name: string
    phone?: string
    email?: string
    address?: string
    membershipId?: string
  }
  
  server?: {
    name: string
    id: string
  }
  
  items: Array<{
    name: string
    quantity: number
    unitPrice: number // minor units
    totalPrice: number // minor units
    category?: string
    sku?: string
    modifiers?: Array<{
      name: string
      price: number // minor units
      quantity: number
    }>
    discounts?: Array<{
      name: string
      amount: number // minor units
    }>
    notes?: string
  }>
  
  totals: {
    subtotal: number // minor units
    discounts: number // minor units
    tax: Array<{
      name: string
      rate: number // percentage
      amount: number // minor units
    }>
    tips: number // minor units
    total: number // minor units
  }
  
  payments: Array<{
    method: string
    amount: number // minor units
    change?: number // minor units
    transactionId: string
    cardLast4?: string
    approvalCode?: string
  }>
  
  company: {
    name: string
    address: string
    phone: string
    email?: string
    cvr: string
    vatNumber?: string
    logo?: string // base64 or URL
  }
  
  metadata?: Record<string, any>
}

export interface KitchenTicketData {
  orderId: string
  orderNumber: string
  timestamp: Date
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  
  table?: {
    number: string
    section?: string
  }
  
  customer?: {
    name: string
    phone?: string
  }
  
  fulfillment?: {
    type: 'pickup' | 'delivery' | 'dine_in'
    estimatedReady: Date
    specialInstructions?: string
  }
  
  items: Array<{
    name: string
    quantity: number
    course: number
    category: string
    modifiers?: Array<{
      name: string
      quantity: number
    }>
    kitchenNotes?: string
    allergens?: string[]
    dietary?: string[]
    cookingInstructions?: string
  }>
  
  priority: 'normal' | 'rush' | 'vip'
  specialInstructions?: string
  allergies?: string[]
  estimatedCookTime?: number // minutes
}

export interface ReceiptFormat {
  type: 'thermal' | 'a4' | 'email' | 'sms'
  width?: number // characters for thermal
  template?: string
  language?: string
  currency?: string
}

export interface PrinterConfig {
  id: string
  name: string
  type: 'thermal' | 'laser' | 'inkjet' | 'email' | 'sms'
  connection: 'usb' | 'network' | 'bluetooth' | 'cloud'
  address?: string // IP, COM port, email, phone number
  port?: number
  settings?: {
    paperWidth?: number
    fontSize?: 'small' | 'medium' | 'large'
    density?: number
    cutType?: 'full' | 'partial' | 'none'
    cashdrawer?: boolean
  }
  location?: string
  active: boolean
}

export interface ReceiptOutput {
  format: ReceiptFormat
  content: string | Buffer
  contentType: string
  size?: number
  metadata?: {
    lineCount?: number
    estimatedPrintTime?: number
    paperUsed?: number // mm
  }
}

export interface PrintJob {
  id: string
  printerId: string
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  completedAt?: Date
  attempts: number
  maxAttempts: number
  error?: string
  receipt: ReceiptOutput
}

export interface ReceiptRenderer {
  readonly name: string
  readonly version: string
  readonly supportedFormats: ReceiptFormat[]
  readonly supportedPrinters: PrinterConfig['type'][]
  
  // Receipt rendering
  renderReceipt(
    data: ReceiptData, 
    format: ReceiptFormat,
    context: ReceiptContext
  ): Promise<ReceiptOutput>
  
  renderKitchenTicket(
    data: KitchenTicketData, 
    format: ReceiptFormat,
    context: ReceiptContext
  ): Promise<ReceiptOutput>
  
  // Printing
  printReceipt(
    receipt: ReceiptOutput, 
    printer: PrinterConfig,
    context: ReceiptContext
  ): Promise<PrintJob>
  
  printKitchenTicket(
    ticket: ReceiptOutput, 
    printer: PrinterConfig,
    context: ReceiptContext
  ): Promise<PrintJob>
  
  // Print job management
  getPrintJob(jobId: string, context: ReceiptContext): Promise<PrintJob>
  cancelPrintJob(jobId: string, context: ReceiptContext): Promise<boolean>
  retryPrintJob(jobId: string, context: ReceiptContext): Promise<PrintJob>
  
  // Email/SMS delivery
  emailReceipt?(
    receipt: ReceiptOutput, 
    email: string, 
    subject?: string,
    context?: ReceiptContext
  ): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }>
  
  smsReceipt?(
    receipt: ReceiptOutput, 
    phone: string,
    context?: ReceiptContext
  ): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }>
  
  // Template management
  getTemplates(context: ReceiptContext): Promise<Array<{
    id: string
    name: string
    type: 'receipt' | 'kitchen_ticket'
    format: ReceiptFormat
    content: string
  }>>
  
  setTemplate(
    templateId: string, 
    template: string,
    context: ReceiptContext
  ): Promise<void>
  
  previewTemplate(
    template: string,
    sampleData: ReceiptData | KitchenTicketData,
    format: ReceiptFormat,
    context: ReceiptContext
  ): Promise<ReceiptOutput>
  
  // Printer management
  discoverPrinters(context: ReceiptContext): Promise<PrinterConfig[]>
  
  testPrinter(
    printer: PrinterConfig,
    context: ReceiptContext
  ): Promise<{
    success: boolean
    latencyMs?: number
    error?: string
    capabilities?: {
      supportsCashDrawer: boolean
      supportsCutting: boolean
      maxWidth: number
      supportedFormats: string[]
    }
  }>
  
  getPrinterStatus(
    printerId: string,
    context: ReceiptContext
  ): Promise<{
    online: boolean
    paperLevel?: 'full' | 'low' | 'empty'
    error?: string
    lastPrintJob?: Date
  }>
  
  // Configuration and health
  validateConfiguration(config: Record<string, any>): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  healthCheck(context: ReceiptContext): Promise<{
    healthy: boolean
    details?: string
    capabilities: {
      canRender: boolean
      canPrint: boolean
      canEmail: boolean
      canSms: boolean
    }
    printerStatus?: Record<string, {
      online: boolean
      error?: string
    }>
  }>
}

// Registry for receipt renderers
export class ReceiptRendererRegistry {
  private renderers = new Map<string, ReceiptRenderer>()
  
  register(renderer: ReceiptRenderer): void {
    if (this.renderers.has(renderer.name)) {
      throw new Error(`Receipt renderer '${renderer.name}' already registered`)
    }
    this.renderers.set(renderer.name, renderer)
  }
  
  get(name: string): ReceiptRenderer {
    const renderer = this.renderers.get(name)
    if (!renderer) {
      throw new Error(`Receipt renderer '${name}' not found`)
    }
    return renderer
  }
  
  list(): ReceiptRenderer[] {
    return Array.from(this.renderers.values())
  }
  
  getByFormat(format: ReceiptFormat['type']): ReceiptRenderer[] {
    return this.list().filter(renderer => 
      renderer.supportedFormats.some(f => f.type === format)
    )
  }
}

export const receiptRegistry = new ReceiptRendererRegistry()
