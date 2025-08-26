// Feature Flags Configuration v1.0
// Copy to src/config/flags.ts to enable

export interface FeatureFlags {
  idempotencyV1: boolean
  outboxV1: boolean
  paymentsV1: boolean
  fulfillmentV1: boolean
  reservationsV1: boolean
  observabilityV1: boolean
}

// Parse from environment variable
export function parseFlags(flagString?: string): FeatureFlags {
  const enabledFlags = new Set(flagString?.split(',').map(f => f.trim()) || [])
  
  return {
    idempotencyV1: enabledFlags.has('idempotencyV1'),
    outboxV1: enabledFlags.has('outboxV1'),
    paymentsV1: enabledFlags.has('paymentsV1'),
    fulfillmentV1: enabledFlags.has('fulfillmentV1'),
    reservationsV1: enabledFlags.has('reservationsV1'),
    observabilityV1: enabledFlags.has('observabilityV1')
  }
}

// Global flags instance
export const flags = parseFlags(process.env.NEXT_PUBLIC_FLAGS)

// Helper to check if any v1 features are enabled
export const hasV1Features = Object.values(flags).some(Boolean)

// Usage examples:
// if (flags.idempotencyV1) { /* use new idempotent order creation */ }
// if (flags.paymentsV1) { /* use payment provider registry */ }
// if (flags.outboxV1) { /* emit events to outbox */ }