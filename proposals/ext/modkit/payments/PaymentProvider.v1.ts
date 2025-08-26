// Payment Provider SPI v1.0
// Pluggable payment processing interface for multichannel POS

export interface PaymentContext {
  tenantId: string
  locationId?: string
  userId: string
  correlationId: string
  orderId?: string
}

export interface PaymentMethod {
  code: string
  name: string
  requiresReference: boolean
  supportsPartial: boolean
  feePercentage: number
  feeFixed: number // in minor units (øre)
  minAmount?: number // in minor units
  maxAmount?: number // in minor units
}

export interface PaymentRequest {
  context: PaymentContext
  amount: number // Minor units (øre)
  currency: string
  reference?: string
  metadata?: Record<string, any>
  idempotencyKey: string
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  providerTransactionId?: string
  amount: number
  fees: number
  netAmount: number
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  providerResponse?: any
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

export interface RefundRequest {
  context: PaymentContext
  originalTransactionId: string
  amount: number // Minor units (øre)
  reason: string
  idempotencyKey: string
  metadata?: Record<string, any>
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  providerResponse?: any
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

export interface WebhookPayload {
  provider: string
  eventType: string
  signature?: string
  timestamp: string
  data: any
}

export interface PaymentProvider {
  readonly name: string
  readonly version: string
  readonly supportedMethods: PaymentMethod[]
  readonly supportedCurrencies: string[]
  
  // Core operations
  processPayment(request: PaymentRequest): Promise<PaymentResult>
  processRefund(request: RefundRequest): Promise<RefundResult>
  
  // Transaction queries
  getTransactionStatus(transactionId: string, context: PaymentContext): Promise<{
    status: 'completed' | 'pending' | 'failed' | 'cancelled'
    amount: number
    fees: number
    updatedAt: string
  }>
  
  // Webhook handling
  handleWebhook(payload: WebhookPayload, context: PaymentContext): Promise<{
    processed: boolean
    events: Array<{
      type: 'payment_completed' | 'payment_failed' | 'refund_completed'
      transactionId: string
      data: any
    }>
  }>
  
  validateWebhookSignature(payload: WebhookPayload): boolean
  
  // Configuration
  validateConfiguration(config: Record<string, any>): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  // Health and capabilities
  healthCheck(context: PaymentContext): Promise<{
    healthy: boolean
    latencyMs?: number
    details?: string
    capabilities: {
      canProcess: boolean
      canRefund: boolean
      canQuery: boolean
    }
  }>
  
  // Fees calculation
  calculateFees(amount: number, method: string): {
    feeAmount: number
    netAmount: number
    breakdown: Array<{
      type: 'percentage' | 'fixed'
      amount: number
      description: string
    }>
  }
}
