// Payment Bridge v1.0
// Legacy adapter that wraps current payment flows into PaymentProvider.v1 interface
// WITHOUT touching existing code - pure wrapper/adapter pattern

import { 
  PaymentProvider, 
  PaymentMethod, 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult, 
  WebhookPayload,
  PaymentContext
} from '../../ext/modkit/payments/PaymentProvider.v1'

// Import types from existing codebase (DO NOT MODIFY THESE)
// These imports would reference the current usePayments.ts and usePaymentSystem.ts
// import { useRecordPayment } from '@/hooks/usePayments'
// import { DEFAULT_PAYMENT_TYPES } from '@/hooks/usePaymentSystem'

/**
 * Legacy Payment Bridge
 * 
 * Wraps the existing payment system to work with the new PaymentProvider interface.
 * This allows gradual migration without breaking existing functionality.
 * 
 * Usage:
 * 1. Register this bridge as a payment provider
 * 2. Route legacy payment methods through it
 * 3. Gradually replace with native providers
 */
export class LegacyPaymentBridge implements PaymentProvider {
  readonly name = 'legacy-bridge'
  readonly version = '1.0.0'
  readonly supportedCurrencies = ['DKK']
  readonly supportedMethods: PaymentMethod[] = [
    {
      code: 'CASH',
      name: 'Cash (Legacy)',
      requiresReference: false,
      supportsPartial: true,
      feePercentage: 0,
      feeFixed: 0
    },
    {
      code: 'CARD',
      name: 'Card (Legacy)',
      requiresReference: true,
      supportsPartial: true,
      feePercentage: 1.75,
      feeFixed: 0
    },
    {
      code: 'MOBILE_PAY',
      name: 'MobilePay (Legacy)',
      requiresReference: true,
      supportsPartial: true,
      feePercentage: 1.0,
      feeFixed: 0
    },
    {
      code: 'GIFT_CARD',
      name: 'Gift Card (Legacy)',
      requiresReference: true,
      supportsPartial: false,
      feePercentage: 0,
      feeFixed: 0
    }
  ]
  
  private legacyRecordPayment: any
  
  constructor() {
    // In real implementation, this would import the existing hook
    // this.legacyRecordPayment = useRecordPayment()
    this.legacyRecordPayment = this.createMockLegacyFunction()
  }
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Map new interface to legacy parameters
      const legacyPaymentRequest = {
        order_id: request.context.orderId || 'unknown',
        amount: request.amount / 100, // Convert from minor units to major units
        payment_method: request.reference ? `${request.metadata?.method || 'CARD'}` : 'CASH',
        transaction_id: request.reference,
        cash_received: request.metadata?.cashReceived,
        change_given: request.metadata?.changeGiven,
        metadata: {
          ...request.metadata,
          tenantId: request.context.tenantId,
          correlationId: request.context.correlationId,
          bridged: true,
          originalAmount: request.amount // Keep original minor units
        }
      }
      
      // Call existing payment recording function
      const legacyResult = await this.legacyRecordPayment.mutateAsync(legacyPaymentRequest)
      
      // Map legacy result to new interface
      return {
        success: true,
        transactionId: legacyResult.id || legacyResult.transaction_id || 'legacy_' + Date.now(),
        providerTransactionId: legacyResult.transaction_id,
        amount: request.amount,
        fees: this.calculateFees(request.amount, request.metadata?.method || 'CASH').feeAmount,
        netAmount: request.amount - this.calculateFees(request.amount, request.metadata?.method || 'CASH').feeAmount,
        status: 'completed',
        providerResponse: {
          legacy: true,
          originalResult: legacyResult,
          processedAt: new Date().toISOString()
        }
      }
      
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        amount: request.amount,
        fees: 0,
        netAmount: request.amount,
        status: 'failed',
        error: {
          code: 'LEGACY_BRIDGE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown legacy payment error',
          retryable: true
        }
      }
    }
  }
  
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      // Legacy refund processing (mock implementation)
      // In real version, this would call existing refund functions
      
      const refundId = `LEGACY_REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        success: true,
        refundId,
        amount: request.amount,
        status: 'completed',
        providerResponse: {
          legacy: true,
          originalTransactionId: request.originalTransactionId,
          reason: request.reason,
          processedAt: new Date().toISOString()
        }
      }
      
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: request.amount,
        status: 'failed',
        error: {
          code: 'LEGACY_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown legacy refund error',
          retryable: true
        }
      }
    }
  }
  
  async getTransactionStatus(transactionId: string, context: PaymentContext) {
    // Legacy systems typically don't support real-time status queries
    // Return a best-guess based on transaction ID format
    
    if (transactionId.startsWith('LEGACY_') || transactionId.startsWith('CASH_')) {
      return {
        status: 'completed' as const,
        amount: 0, // Would need to look up from database
        fees: 0,
        updatedAt: new Date().toISOString()
      }
    }
    
    return {
      status: 'completed' as const,
      amount: 0,
      fees: 0,
      updatedAt: new Date().toISOString()
    }
  }
  
  async handleWebhook(payload: WebhookPayload, context: PaymentContext) {
    // Legacy systems typically don't have webhooks
    return {
      processed: false,
      events: []
    }
  }
  
  validateWebhookSignature(payload: WebhookPayload): boolean {
    // Legacy systems typically don't have webhook signatures
    return false
  }
  
  validateConfiguration(config: Record<string, any>) {
    // Legacy bridge needs no special configuration
    return { 
      valid: true, 
      errors: [],
      warnings: [
        'Using legacy payment bridge - consider migrating to native providers',
        'Limited webhook and real-time status support'
      ]
    }
  }
  
  async healthCheck(context: PaymentContext) {
    try {
      // Test if legacy payment system is accessible
      // In real implementation, this might make a test call
      
      return {
        healthy: true,
        latencyMs: 50, // Mock latency
        details: 'Legacy payment bridge operational',
        capabilities: {
          canProcess: true,
          canRefund: true,
          canQuery: false // Limited query capabilities
        }
      }
    } catch (error) {
      return {
        healthy: false,
        details: 'Legacy payment system unavailable',
        capabilities: {
          canProcess: false,
          canRefund: false,
          canQuery: false
        }
      }
    }
  }
  
  calculateFees(amount: number, method: string) {
    // Use the same fee calculation as the legacy system
    const methodConfig = this.supportedMethods.find(m => m.code === method)
    
    if (!methodConfig) {
      return {
        feeAmount: 0,
        netAmount: amount,
        breakdown: []
      }
    }
    
    const percentageFee = Math.round(amount * (methodConfig.feePercentage / 100))
    const fixedFee = methodConfig.feeFixed
    const totalFee = percentageFee + fixedFee
    
    return {
      feeAmount: totalFee,
      netAmount: amount - totalFee,
      breakdown: [
        ...(percentageFee > 0 ? [{
          type: 'percentage' as const,
          amount: percentageFee,
          description: `${methodConfig.feePercentage}% processing fee`
        }] : []),
        ...(fixedFee > 0 ? [{
          type: 'fixed' as const,
          amount: fixedFee,
          description: 'Fixed processing fee'
        }] : [])
      ]
    }
  }
  
  // Mock legacy payment function (for demonstration)
  private createMockLegacyFunction() {
    return {
      mutateAsync: async (request: any) => {
        // Simulate the existing useRecordPayment behavior
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay
        
        return {
          id: `legacy_${Date.now()}`,
          transaction_id: request.transaction_id || `tx_${Date.now()}`,
          status: 'completed',
          amount: request.amount,
          order_id: request.order_id
        }
      }
    }
  }
}

/**
 * Factory function to create and configure the legacy bridge
 * 
 * Usage in feature flag context:
 * 
 * ```typescript
 * if (flags.paymentsV1) {
 *   const legacyBridge = createLegacyPaymentBridge()
 *   paymentRegistry.register(legacyBridge, {
 *     name: 'legacy-bridge',
 *     enabled: true,
 *     priority: 999, // Lowest priority
 *     config: {}
 *   })
 * }
 * ```
 */
export function createLegacyPaymentBridge(): LegacyPaymentBridge {
  return new LegacyPaymentBridge()
}

/**
 * Helper function to check if a payment method should use legacy bridge
 */
export function shouldUseLegacyBridge(method: string, context: PaymentContext): boolean {
  // Use legacy bridge if:
  // 1. Feature flag is enabled but specific provider not available
  // 2. Fallback mode is active
  // 3. Specific tenant configuration requires it
  
  const legacyMethods = ['CASH', 'CARD', 'MOBILE_PAY', 'GIFT_CARD']
  return legacyMethods.includes(method)
}

/**
 * Migration helper to gradually replace legacy methods
 */
export interface MigrationConfig {
  method: string
  tenantIds: string[]
  useNativeProvider: boolean
  rolloutPercentage: number
}

export function shouldMigrateMethod(
  method: string, 
  tenantId: string, 
  migrationConfig: MigrationConfig[]
): boolean {
  const config = migrationConfig.find(c => c.method === method)
  if (!config) return false
  
  if (!config.tenantIds.includes(tenantId)) return false
  
  // Simple percentage-based rollout
  const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const percentage = (hash % 100) + 1
  
  return percentage <= config.rolloutPercentage
}

