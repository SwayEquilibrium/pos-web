# Feature Flags Configuration

## Environment Variable Setup

Add to your `.env.local` or deployment environment:

```env
# Enable specific features (comma-separated)
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1

# Full feature set (for staging/testing)
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1,paymentsV1,fulfillmentV1,reservationsV1,observabilityV1
```

## Flag Definitions

### UI/UX Enhancement Features
- **`contextualSaveV1`** - Enable contextual save buttons in settings pages
  - Environment Variable: `NEXT_PUBLIC_CONTEXTUAL_SAVE_V1=true`
  - Default: `false` (enabled in development)
  - Features: Smart change detection, floating save/cancel buttons, form reset functionality
  - Affected Pages: `/admin/business/settings`, `/modules/business/settings`

### Data Management Features
- **`menuDataSyncV1`** - Enhanced menu data synchronization with no mock data
  - Environment Variable: `NEXT_PUBLIC_MENU_DATA_SYNC_V1=true`
  - Default: `false` (enabled in development)
  - Features: Eliminates all mock data, clear error messages for missing data, database setup verification, actionable feedback
  - Affected Pages: `/orders/[tableId]`, menu management screens
  - **Philosophy**: Never show mock data - always indicate when real data is missing so issues can be properly fixed

- **`modifierManagementV1`** - Enhanced modifier management with contextual save and no mock data
  - Environment Variable: `NEXT_PUBLIC_MODIFIER_MANAGEMENT_V1=true`
  - Default: `false` (enabled in development)
  - Features: Real-time database operations, contextual save buttons, inline editing, proper error states, no mock data
  - Affected Pages: `/menu/addons-modifiers`
  - **Philosophy**: Show real database state - empty placeholders instead of fake data, clear setup instructions when needed

### Core Safety Features
- **`idempotencyV1`** - Enable idempotency protection for orders/payments
- **`outboxV1`** - Enable event outbox for reliable side effects

### Business Features  
- **`paymentsV1`** - Use pluggable payment provider registry
- **`fulfillmentV1`** - Enable takeaway/delivery slot scheduling
- **`reservationsV1`** - Enable table reservation system

### Operational Features
- **`observabilityV1`** - Enable structured logging and metrics

## Gradual Rollout Strategy

### Phase 1: Safety First
```env
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1
```
Deploy idempotency and event outbox to prevent data loss.

### Phase 2: Payment Flexibility
```env
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1,paymentsV1
```
Enable payment provider registry for extensibility.

### Phase 3: Business Features
```env
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1,paymentsV1,fulfillmentV1,reservationsV1
```
Roll out scheduling and booking capabilities.

### Phase 4: Full Observability
```env
NEXT_PUBLIC_FLAGS=idempotencyV1,outboxV1,paymentsV1,fulfillmentV1,reservationsV1,observabilityV1
```
Enable comprehensive monitoring and logging.

## Usage Pattern

```typescript
import { parseFlags } from '@/proposals/glue/flags.example'

const flags = parseFlags(process.env.NEXT_PUBLIC_FLAGS)

// Conditional logic based on flags
if (flags.idempotencyV1) {
  return createOrderWithIdempotency(params)
} else {
  return createOrderLegacy(params)
}
```

## Testing Combinations

Test each flag combination in isolation before combining:

1. Test `idempotencyV1` alone
2. Test `outboxV1` alone  
3. Test `idempotencyV1,outboxV1` together
4. Continue adding one flag at a time

## Monitoring Flag Usage

Track flag adoption in your analytics:

```typescript
// Example metrics collection
analytics.track('feature_flag_used', {
  flag: 'idempotencyV1',
  enabled: flags.idempotencyV1,
  user_id: userId,
  tenant_id: tenantId
})
```

