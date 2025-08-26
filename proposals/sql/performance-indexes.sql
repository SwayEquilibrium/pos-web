-- Performance Indexes v1.0
-- Critical indexes for hot-path queries

-- Orders hot paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_company_status_created 
ON public.orders(company_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_table_active
ON public.orders(table_id, status) 
WHERE status IN ('active', 'pending', 'preparing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_type_status_time
ON public.orders(type, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_paid_at
ON public.orders(paid_at DESC) 
WHERE paid_at IS NOT NULL;

-- Order items performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_product
ON public.order_items(order_id, product_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_fire_state
ON public.order_items(fire_state, created_at)
WHERE fire_state IS NOT NULL;

-- Payment transactions hot paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_order_status
ON public.payment_transactions(order_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_reference
ON public.payment_transactions(reference_number)
WHERE reference_number IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_processed_at
ON public.payment_transactions(processed_at DESC)
WHERE processed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_company_date
ON public.payment_transactions(
  (SELECT company_id FROM public.orders WHERE id = order_id),
  DATE(processed_at)
) WHERE processed_at IS NOT NULL;

-- Product search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_active_search
ON public.products(company_id, active, name) 
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trigram
ON public.products USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active
ON public.products(category_id, active, sort_order)
WHERE active = true;

-- User authorization lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_company
ON public.user_profiles(id, company_id) 
WHERE company_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_company_role
ON public.user_profiles(company_id, role);

-- Tables and reservations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_company_active
ON public.tables(company_id, active)
WHERE active = true;

-- Reservation time windows (if reservations table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_time_window
ON public.reservations(reservation_date, reservation_time, duration_minutes)
WHERE status IN ('confirmed', 'seated');

-- Audit and activity logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_table_created
ON public.audit_logs(company_id, table_name, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_company_created
ON public.user_activity_logs(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_resource
ON public.user_activity_logs(resource_type, resource_id)
WHERE resource_id IS NOT NULL;

-- Event processing (if event_outbox exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_outbox_processing_order
ON public.event_outbox(processed_at, next_retry_at, occurred_at)
WHERE processed_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_outbox_correlation
ON public.event_outbox(correlation_id);

-- Idempotency lookups (if idempotency_keys exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_lookup
ON public.idempotency_keys(company_id, key, operation);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_cleanup
ON public.idempotency_keys(expires_at) 
WHERE status IN ('completed', 'failed');

-- Gift cards and customer groups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gift_cards_code_active
ON public.gift_cards(code, status)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_groups_company_active
ON public.customer_groups(company_id, active)
WHERE active = true;

-- Categories hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_sort
ON public.categories(parent_id, sort_order)
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_company_parent
ON public.categories(company_id, parent_id);

-- Modifiers performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modifiers_group_active
ON public.modifiers(group_id, active, sort_index)
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_modifiers_product
ON public.product_modifiers(product_id, sort_index);

-- Fulfillment slots (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fulfillment_slots_availability
ON public.fulfillment_slots(slot_date, slot_type, active)
WHERE current_bookings < max_capacity AND active = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_complex_lookup
ON public.orders(company_id, type, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_summary
ON public.payment_transactions(
  (SELECT company_id FROM public.orders WHERE id = order_id),
  payment_method,
  status,
  DATE(processed_at)
) WHERE status = 'completed' AND processed_at IS NOT NULL;

-- Partial indexes for common filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_active_today
ON public.orders(company_id, table_id, created_at)
WHERE status IN ('active', 'pending', 'preparing') 
  AND created_at >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_takeaway_orders_active
ON public.orders(company_id, status, created_at DESC)
WHERE type = 'takeaway' 
  AND status IN ('pending', 'preparing', 'ready');

-- Statistics update for query planner
-- Run this periodically to keep statistics fresh
-- ANALYZE public.orders;
-- ANALYZE public.order_items;
-- ANALYZE public.payment_transactions;
-- ANALYZE public.products;
