# Multichannel POS Scale & Modularity Audit — Safe, Create-Only Proposals

## 1) Executive Summary

- **CRITICAL**: Hardcoded payment providers in `hooks/usePaymentSystem.ts:89-137` prevent extensibility and vendor lock-in
- **CRITICAL**: No idempotency protection on order creation (`hooks/useOrders.ts:42`) allows duplicate charges
- **CRITICAL**: Missing fulfillment slots system blocks takeaway/delivery scheduling at scale
- **HIGH**: No event outbox pattern - side effects processed synchronously risk data loss
- **HIGH**: Weak RLS policies in `database/sales-tracking-system.sql:399` allow cross-tenant data access
- **HIGH**: No reservation/booking system despite UI placeholders in `app/admin/operations/booking/page.tsx:9`
- **MEDIUM**: Missing hot-path indexes on orders/status/time queries will degrade at scale
- **MEDIUM**: No structured logging or correlation IDs hinders debugging distributed operations
- **LOW**: Audit logging exists but lacks comprehensive event coverage

## 2) Inventory (Repo + Schema)

### Folder Map (Top 3 Levels)
```
app/
├── admin/ (business, economy, menu, operations, sales, settings, system)
├── menu/ ([menuId], addons-modifiers, card)
├── modules/ (business, economy, menu, operations, sales, system)
├── orders/ ([tableId], app, takeaway)
├── settings/components/
└── takeaway/

components/ui/
contexts/
database/ (57 SQL migration files)
hooks/
lib/
```

### Tables Found vs Missing

**✅ Found:**
- companies, user_profiles, orders, order_items, products, categories
- payment_transactions, payment_types, gift_cards, customer_groups
- audit_logs, user_activity_logs, modifier_groups, modifiers
- tables (referenced in orders)

**❌ Missing Critical:**
- locations (no multi-location support)
- reservations, reservation_tables (booking system missing)
- fulfillment_slots (no takeaway/delivery scheduling)
- idempotency_keys (no duplicate operation protection)
- event_outbox (no reliable side effects)
- refunds (no refund tracking)
- price_lists, tax_rates, discounts (hardcoded pricing)
- inventory_movements, receipts (no stock/receipt tracking)

### RLS Summary
- **✅ Enabled:** companies, user_profiles, products, categories, gift_cards, audit_logs
- **⚠️ Weak Policies:** orders (`USING (true)`), order_items (`USING (true)`) - NO tenant isolation
- **❌ Missing:** payment_transactions (no RLS at all), many core tables lack proper tenant filtering

## 3) Top Findings

### Finding 1: No Idempotency Protection (CRITICAL)
**File:** `hooks/useOrders.ts:42`
**Symptom:** `await supabase.rpc('create_order', payload)` - no idempotency key
**Risk:** Double-tapping order creation creates duplicate orders and charges
**Fix:** → `/proposals/adapters/orders/createOrderWithIdem.v1.ts`

### Finding 2: Hardcoded Payment Providers (CRITICAL)
**File:** `hooks/usePaymentSystem.ts:89-137`
**Symptom:** `DEFAULT_PAYMENT_TYPES` array hardcoded with 'CASH', 'CARD', 'MOBILE_PAY'
**Risk:** Cannot add new payment providers without code changes, vendor lock-in
**Fix:** → `/proposals/ext/modkit/payments/PaymentProvider.v1.ts`

### Finding 3: Broken Tenant Isolation (CRITICAL)
**File:** `database/sales-tracking-system.sql:399`
**Symptom:** `USING (true)` in RLS policies allows cross-tenant access
**Risk:** Data breach - any authenticated user can access all company data
**Fix:** → `/proposals/migrations/007_rls_templates.sql`

### Finding 4: Missing Fulfillment System (HIGH)
**File:** `app/takeaway/page.tsx:81-88`
**Symptom:** Manual status updates only, no scheduling or capacity management
**Risk:** Cannot scale takeaway/delivery operations, overselling time slots
**Fix:** → `/proposals/ext/modkit/fulfillment/FulfillmentProvider.v1.ts`

### Finding 5: No Event Outbox (HIGH)
**File:** Not found - no event_outbox table exists
**Symptom:** Side effects (receipts, inventory, webhooks) processed synchronously
**Risk:** Failed side effects lost, poor reliability at scale
**Fix:** → `/proposals/migrations/002_event_outbox.sql`

### Finding 6: Missing Reservation System (HIGH)
**File:** `app/admin/operations/booking/page.tsx:9`
**Symptom:** `router.replace('/admin/booking')` - just redirects, no actual booking
**Risk:** Cannot handle table reservations, manual booking processes
**Fix:** → `/proposals/migrations/003_reservations.sql`

### Finding 7: Missing Hot-Path Indexes (MEDIUM)
**File:** Various database tables lack composite indexes
**Symptom:** No indexes on orders(tenant_id, status, created_at), payments(provider_ref)
**Risk:** Query performance degrades with scale, slow order lookups
**Fix:** → `/proposals/migrations/005_indexes.sql`

## 4) Feature Flags (Create-Only)

Created: `/proposals/glue/flags.example.ts`
Created: `/proposals/docs/flags.md`

## 5) Extensibility SPIs (Create-Only)

### Payment System
- `/proposals/ext/modkit/payments/PaymentProvider.v1.ts`
- `/proposals/ext/modkit/payments/registry.v1.ts`
- `/proposals/ext/modkit/payments/providers/CashProvider.v1.ts`

### Fulfillment System
- `/proposals/ext/modkit/fulfillment/FulfillmentProvider.v1.ts`
- `/proposals/ext/modkit/fulfillment/quoteSlots.v1.ts`

### Kitchen/Printing
- `/proposals/ext/modkit/kitchen/ReceiptRenderer.v1.ts`
- `/proposals/ext/modkit/kitchen/KDSDispatcher.v1.ts`

### Tax/Discount Engine
- `/proposals/ext/modkit/pricing/TaxDiscountEngine.v1.ts`

### Legacy Adapters
- `/proposals/adapters/legacy/paymentBridge.v1.ts`

## 6) DB Migrations (Create-Only)

All files created under `/proposals/migrations/`:
- `001_idempotency.sql` - Idempotency keys with 24h expiry
- `002_event_outbox.sql` - Event outbox with retry logic
- `003_reservations.sql` - Reservation system with time ranges
- `004_fulfillment_slots.sql` - Capacity management for takeaway/delivery
- `005_indexes.sql` - Hot-path performance indexes
- `006_audit_logs.sql` - Comprehensive audit logging
- `007_rls_templates.sql` - Proper tenant isolation policies

## 7) Eventing (Create-Only)

- `/proposals/ext/modkit/events/types.v1.ts` - Domain event definitions
- `/proposals/workers/outboxDispatcher.v1.ts` - Background event processor
- `/proposals/api/cron/outbox.v1.ts` - Cron endpoint for event processing

## 8) Minimal Adoption Diffs (Create-Only)

Generated diffs for gradual adoption:
- Orders: Wrap with idempotency
- Payments: Use provider registry
- Takeaway: Add slot quoting
- Booking: Expose reservation API

## 9) Observability (Create-Only)

- `/proposals/ext/modkit/obs/logger.v1.ts` - Structured JSON logger
- `/proposals/docs/metrics.md` - Essential metrics definitions

## 10) Tests (Create-Only)

Test stubs under `/proposals/tests/`:
- Idempotency replay tests
- Payment double-tap protection
- Outbox retry logic
- Reservation overlap prevention
- Slot capacity management

## 11) Rollout Plan

Step-by-step deployment guide in `/proposals/docs/rollout.md`

## 12) Verification Checklist

Quick validation checks in `/proposals/docs/verification.md`

