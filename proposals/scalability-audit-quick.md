# POS Scalability & Modularity Quick Audit

## 1) Executive Summary

- **CRITICAL**: No booking/reservation system - just placeholder redirects
- **CRITICAL**: No idempotency on order creation/payment allows double charges
- **CRITICAL**: Hardcoded payment providers prevent extensibility
- **HIGH**: Missing fulfillment scheduling for takeaway/delivery
- **MEDIUM**: No event outbox for reliable side effects processing

## 2) Inventory

**Found Tables:**
- ✅ companies, user_profiles, orders, order_items, products, categories
- ✅ payment_transactions, payment_types, gift_cards, customer_groups
- ✅ audit_logs, user_activity_logs, modifier_groups, modifiers

**Missing Tables:**
- ❌ locations, reservations, reservation_tables, fulfillment_slots
- ❌ idempotency_keys, event_outbox, refunds
- ❌ price_lists, tax_rates, discounts, inventory_movements, receipts

## 3) Top 5 Critical Findings

### Finding 1: No Reservation System (CRITICAL)
**File:** `app/admin/operations/booking/page.tsx:9`
```typescript
router.replace('/admin/booking') // Just redirects - no actual booking
```

### Finding 2: No Idempotency Protection (CRITICAL)
**File:** `hooks/useOrders.ts:42`
```typescript
const { data, error } = await supabase.rpc('create_order', payload) // No idempotency key
```

### Finding 3: Hardcoded Payment Providers (HIGH)
**File:** `hooks/usePaymentSystem.ts:89-137`
```typescript
const DEFAULT_PAYMENT_TYPES: PaymentType[] = [
  { code: 'CASH', name: 'Cash', fee_percentage: 0 }, // Hardcoded
```

### Finding 4: No Fulfillment Scheduling (HIGH)
**File:** `app/takeaway/page.tsx:81-88`
```typescript
const handleUpdateStatus = async (orderId: string, status: 'preparing' | 'ready' | 'completed' | 'cancelled') => {
  // Manual status updates only - no scheduling
```

### Finding 5: Missing Event Architecture (MEDIUM)
**File:** No event_outbox table found
- Side effects (receipts, inventory, webhooks) processed synchronously

## 4) Minimal SPIs (Create-Only)

See `/proposals/spi/` directory for:
- PaymentProvider.v1.ts
- FulfillmentProvider.v1.ts  
- ReceiptRenderer.v1.ts
- registry.v1.ts

## 5) DB Proposals

See `/proposals/sql/` directory for:
- idempotency-system.sql
- event-outbox.sql
- reservations-system.sql
- performance-indexes.sql

## 6) Rollout Notes

**Feature Flags:**
- `ENABLE_IDEMPOTENCY=true`
- `ENABLE_RESERVATIONS=true`
- `USE_PAYMENT_REGISTRY=true`
- `ENABLE_EVENT_OUTBOX=true`

**No Rewires:** All proposals are additive - existing code unchanged.

