// Cash Payment Provider v1.0
// Example implementation for immediate cash transactions

import { 
  PaymentProvider, 
  PaymentMethod, 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult, 
  WebhookPayload,
  PaymentContext
} from '../PaymentProvider.v1'

export class CashProvider implements PaymentProvider {
  readonly name = 'cash'
  readonly version = '1.0.0'
  readonly supportedCurrencies = ['DKK', 'EUR', 'USD']
  readonly supportedMethods: PaymentMethod[] = [
    {
      code: 'CASH',
      name: 'Cash',
      requiresReference: false,
      supportsPartial: true,
      feePercentage: 0,
      feeFixed: 0,
      minAmount: 100, // 1 DKK minimum
      maxAmount: 1000000 // 10,000 DKK maximum
    }
  ]
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Validate amount
    if (request.amount < 100) {
      return {
        success: false,
        transactionId: '',
        amount: request.amount,
        fees: 0,
        netAmount: request.amount,
        status: 'failed',
        error: {
          code: 'AMOUNT_TOO_LOW',
          message: 'Minimum cash payment is 1.00 DKK',
          retryable: false
        }
      }
    }
    
    // Cash payments are always immediate and successful
    const transactionId = `CASH_${request.context.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      success: true,
      transactionId,
      amount: request.amount,
      fees: 0,
      netAmount: request.amount,
      status: 'completed',
      providerResponse: {
        method: 'cash',
        processedAt: new Date().toISOString(),
        currency: request.currency,
        tenantId: request.context.tenantId,
        locationId: request.context.locationId,
        correlationId: request.context.correlationId
      }
    }
  }
  
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    // Cash refunds are manual process - always succeed for tracking
    const refundId = `CASH_REFUND_${request.context.tenantId}_${Date.now()}`
    
    return {
      success: true,
      refundId,
      amount: request.amount,
      status: 'completed', // Assumed completed for cash (manual process)
      providerResponse: {
        method: 'cash_refund',
        processedAt: new Date().toISOString(),
        originalTransactionId: request.originalTransactionId,
        reason: request.reason,
        tenantId: request.context.tenantId
      }
    }
  }
  
  async getTransactionStatus(transactionId: string, context: PaymentContext) {
    // Cash transactions are always completed immediately
    return {
      status: 'completed' as const,
      amount: 0, // Would need to look up from database
      fees: 0,
      updatedAt: new Date().toISOString()
    }
  }
  
  async handleWebhook(payload: WebhookPayload, context: PaymentContext) {
    // Cash has no webhooks
    throw new Error('Cash provider does not support webhooks')
  }
  
  validateWebhookSignature(payload: WebhookPayload): boolean {
    // Cash has no webhooks
    return false
  }
  
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] } {
    // Cash needs no configuration
    return { 
      valid: true, 
      errors: [],
      warnings: ['Cash payments require manual reconciliation']
    }
  }
  
  async healthCheck(context: PaymentContext) {
    // Cash is always available
    return { 
      healthy: true, 
      latencyMs: 0,
      details: 'Cash payment always available',
      capabilities: {
        canProcess: true,
        canRefund: true,
        canQuery: false // No real-time status for cash
      }
    }
  }
  
  calculateFees(amount: number, method: string) {
    // Cash has no fees
    return {
      feeAmount: 0,
      netAmount: amount,
      breakdown: [
        {
          type: 'fixed' as const,
          amount: 0,
          description: 'No fees for cash payments'
        }
      ]
    }
  }
}
