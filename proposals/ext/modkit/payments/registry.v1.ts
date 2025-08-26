// Payment Provider Registry v1.0
// Central registry for managing payment providers with tenant isolation

import { PaymentProvider, PaymentContext } from './PaymentProvider.v1'

export interface ProviderConfig {
  name: string
  enabled: boolean
  tenantIds?: string[] // If specified, only available to these tenants
  locationIds?: string[] // If specified, only available to these locations
  config: Record<string, any>
  priority: number // Lower number = higher priority
}

export class PaymentProviderRegistry {
  private providers = new Map<string, PaymentProvider>()
  private configs = new Map<string, ProviderConfig>()
  private defaultProvider?: string
  
  register(provider: PaymentProvider, config: ProviderConfig): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Payment provider '${provider.name}' already registered`)
    }
    
    // Validate configuration
    const validation = provider.validateConfiguration(config.config)
    if (!validation.valid) {
      throw new Error(`Invalid configuration for ${provider.name}: ${validation.errors.join(', ')}`)
    }
    
    this.providers.set(provider.name, provider)
    this.configs.set(provider.name, config)
  }
  
  unregister(name: string): boolean {
    const removed = this.providers.delete(name)
    this.configs.delete(name)
    return removed
  }
  
  get(name: string, context?: PaymentContext): PaymentProvider {
    const provider = this.providers.get(name)
    if (!provider) {
      throw new Error(`Payment provider '${name}' not found`)
    }
    
    // Check tenant/location access if context provided
    if (context) {
      const config = this.configs.get(name)
      if (config) {
        if (config.tenantIds && !config.tenantIds.includes(context.tenantId)) {
          throw new Error(`Payment provider '${name}' not available for tenant ${context.tenantId}`)
        }
        if (config.locationIds && context.locationId && !config.locationIds.includes(context.locationId)) {
          throw new Error(`Payment provider '${name}' not available for location ${context.locationId}`)
        }
        if (!config.enabled) {
          throw new Error(`Payment provider '${name}' is disabled`)
        }
      }
    }
    
    return provider
  }
  
  getAvailable(context: PaymentContext): Array<{
    provider: PaymentProvider
    config: ProviderConfig
  }> {
    const available: Array<{ provider: PaymentProvider; config: ProviderConfig }> = []
    
    for (const [name, provider] of this.providers) {
      try {
        const config = this.configs.get(name)!
        
        // Check availability
        if (!config.enabled) continue
        if (config.tenantIds && !config.tenantIds.includes(context.tenantId)) continue
        if (config.locationIds && context.locationId && !config.locationIds.includes(context.locationId)) continue
        
        available.push({ provider, config })
      } catch (error) {
        // Skip unavailable providers
        continue
      }
    }
    
    // Sort by priority (lower number = higher priority)
    return available.sort((a, b) => a.config.priority - b.config.priority)
  }
  
  getDefault(context?: PaymentContext): PaymentProvider {
    if (!this.defaultProvider) {
      throw new Error('No default payment provider set')
    }
    return this.get(this.defaultProvider, context)
  }
  
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set unknown provider '${name}' as default`)
    }
    this.defaultProvider = name
  }
  
  list(): Array<{
    name: string
    provider: PaymentProvider
    config: ProviderConfig
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      provider,
      config: this.configs.get(name)!
    }))
  }
  
  async healthCheck(context?: PaymentContext): Promise<Record<string, {
    healthy: boolean
    latencyMs?: number
    error?: string
    capabilities?: any
  }>> {
    const results: Record<string, any> = {}
    const providers = context ? this.getAvailable(context) : this.list()
    
    await Promise.allSettled(
      providers.map(async ({ provider, config }) => {
        try {
          const startTime = Date.now()
          const health = await provider.healthCheck(context || {
            tenantId: 'health-check',
            userId: 'system',
            correlationId: `health-${Date.now()}`
          })
          results[provider.name] = {
            ...health,
            latencyMs: Date.now() - startTime
          }
        } catch (error) {
          results[provider.name] = {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    return results
  }
  
  // Get best provider for a specific payment method
  getBestProvider(method: string, context: PaymentContext): PaymentProvider {
    const available = this.getAvailable(context)
    
    for (const { provider } of available) {
      if (provider.supportedMethods.some(m => m.code === method)) {
        return provider
      }
    }
    
    throw new Error(`No provider available for payment method '${method}'`)
  }
}

// Global registry instance
export const paymentRegistry = new PaymentProviderRegistry()

// Feature flag check
export function isPaymentRegistryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FLAGS?.includes('paymentsV1') === true
}
