// Cash Payment Provider v1.0
// Example implementation of PaymentProvider interface

import { PaymentProvider, PaymentMethod, PaymentRequest, PaymentResult, RefundRequest, RefundResult, WebhookPayload } from './PaymentProvider.v1'

export class CashProvider implements PaymentProvider {
  readonly name = 'cash'
  readonly version = '1.0.0'
  readonly supportedMethods: PaymentMethod[] = [
    {
      code: 'CASH',
      name: 'Cash',
      requiresReference: false,
      supportsPartial: true,
      feePercentage: 0,
      feeFixed: 0
    }
  ]
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Cash payments are always immediate
    return {
      success: true,
      transactionId: `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: request.amount,
      fees: 0,
      status: 'completed',
      providerResponse: {
        method: 'cash',
        processedAt: new Date().toISOString(),
        currency: request.currency
      }
    }
  }
  
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    // Cash refunds are manual process
    return {
      success: true,
      refundId: `CASH_REFUND_${Date.now()}`,
      amount: request.amount,
      status: 'completed' // Assumed completed for cash
    }
  }
  
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Cash has no webhooks
    throw new Error('Cash provider does not support webhooks')
  }
  
  validateWebhookSignature(payload: WebhookPayload): boolean {
    // Cash has no webhooks
    return false
  }
  
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] } {
    // Cash needs no configuration
    return { valid: true, errors: [] }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; details?: string }> {
    // Cash is always available
    return { healthy: true, details: 'Cash payment always available' }
  }
}

