// Payment Provider SPI v1.0
// Pluggable payment processing interface

export interface PaymentMethod {
  code: string
  name: string
  requiresReference: boolean
  supportsPartial: boolean
  feePercentage: number
  feeFixed: number
}

export interface PaymentRequest {
  orderId: string
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
  status: 'completed' | 'pending' | 'failed'
  providerResponse?: any
  error?: string
}

export interface RefundRequest {
  originalTransactionId: string
  amount: number
  reason: string
  idempotencyKey: string
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  error?: string
}

export interface WebhookPayload {
  provider: string
  eventType: string
  data: any
  signature?: string
}

export interface PaymentProvider {
  readonly name: string
  readonly version: string
  readonly supportedMethods: PaymentMethod[]
  
  // Core operations
  processPayment(request: PaymentRequest): Promise<PaymentResult>
  processRefund(request: RefundRequest): Promise<RefundResult>
  
  // Webhook handling
  handleWebhook(payload: WebhookPayload): Promise<void>
  validateWebhookSignature(payload: WebhookPayload): boolean
  
  // Configuration
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] }
  
  // Health check
  healthCheck(): Promise<{ healthy: boolean; details?: string }>
}

