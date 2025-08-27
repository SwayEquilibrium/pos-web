// Payment Provider Registry v1.0
// Central registry for managing payment providers

import { PaymentProvider } from './PaymentProvider.v1'

export class PaymentProviderRegistry {
  private providers = new Map<string, PaymentProvider>()
  private defaultProvider?: string
  
  register(provider: PaymentProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Payment provider '${provider.name}' already registered`)
    }
    
    this.providers.set(provider.name, provider)
  }
  
  unregister(name: string): boolean {
    return this.providers.delete(name)
  }
  
  get(name: string): PaymentProvider {
    const provider = this.providers.get(name)
    if (!provider) {
      throw new Error(`Payment provider '${name}' not found`)
    }
    return provider
  }
  
  getDefault(): PaymentProvider {
    if (!this.defaultProvider) {
      throw new Error('No default payment provider set')
    }
    return this.get(this.defaultProvider)
  }
  
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set unknown provider '${name}' as default`)
    }
    this.defaultProvider = name
  }
  
  list(): PaymentProvider[] {
    return Array.from(this.providers.values())
  }
  
  listNames(): string[] {
    return Array.from(this.providers.keys())
  }
  
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck()
        results[name] = health.healthy
      } catch (error) {
        results[name] = false
      }
    }
    
    return results
  }
}

// Global registry instance
export const paymentRegistry = new PaymentProviderRegistry()

// Feature flag check
export function isPaymentRegistryEnabled(): boolean {
  return process.env.USE_PAYMENT_REGISTRY === 'true'
}

