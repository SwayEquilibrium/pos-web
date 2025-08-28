# PROJECT_CONTEXT.md

## Purpose
One source of truth for architecture, schema, endpoints, and naming. All code MUST follow this.

## Modules
- Menu Management (SSOT): menus, categories, products, modifiers.
- Orders: references product IDs from Menu.
- Payments: rows linked to order_id; gateway IDs ONLY here.
- Tables: orders link to table_id.
- Auth: Supabase Auth; user has company_id.

## Supabase tables (high level)
companies, menus, categories, products, modifier_groups, modifiers, tables, orders, order_items, payments.

### Companies Table Schema
- Core fields: id, name, cvr, address, city, postal_code, country, phone, email
- Extended fields: website, vat_number, logo_url, receipt_message
- All fields are optional except id, name, cvr, address, city, postal_code, country

## API Namespaces (only if business logic/webhooks required)
- /api/menu, /api/orders, /api/payments, /api/tables, /api/auth

## Repository Layer (Supabase-first)
lib/supabaseClient.ts (single client)
lib/repos/menu.repo.ts, orders.repo.ts, payments.repo.ts, tables.repo.ts, printers.repo.ts

## Hooks (wrap repos via React Query/SWR)
useMenu(menuId), useOrders(tableId), useCreatePayment(orderId), useTables(), useAuth()

## Rules
1) Menu is SSOT. 2) No duplicate endpoints/hooks. 3) Payment IDs only in payments (linked by order_id).
4) Components never fetch directly — always repo → hook → (context). 5) Update this file before adding features.
