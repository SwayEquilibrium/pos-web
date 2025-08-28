# AUDIT.md - SUPABASE FOCUSED AUDIT

## 1. 📂 Supabase Tables (Schema & Relations)

### Core Menu System Tables
- **`tax_codes`**
  - Fields: `id` (uuid, PK), `name` (text, unique), `rate` (numeric), `created_at`, `updated_at`
  - Relations: Referenced by `product_prices.tax_code_id`

- **`product_groups`**
  - Fields: `id` (uuid, PK), `name` (text, unique), `description`, `sort_index`, `active`, `created_at`, `updated_at`
  - Relations: Referenced by `products.product_group_id`

- **`categories`**
  - Fields: `id` (uuid, PK), `parent_id` (self-reference), `name`, `description`, `sort_index`, `print_sort_index`, `active`, `created_at`, `updated_at`
  - Relations: Self-referencing hierarchy, referenced by `products.category_id`, `menucard_categories.category_id`

- **`products`**
  - Fields: `id` (uuid, PK), `name`, `category_id`, `product_group_id`, `description`, `sort_index`, `active`, `created_at`, `updated_at`
  - Relations: References `categories.id`, `product_groups.id`, referenced by `product_prices.product_id`, `product_modifier_groups.product_id`

- **`product_prices`**
  - Fields: `id` (uuid, PK), `product_id`, `context` (dine_in/takeaway), `price`, `tax_code_id`, `created_at`, `updated_at`
  - Relations: References `products.id`, `tax_codes.id`

- **`menucards`**
  - Fields: `id` (uuid, PK), `name` (unique), `description`, `active`, `sort_index`, `created_at`, `updated_at`
  - Relations: Referenced by `menucard_categories.menucard_id`

- **`menucard_categories`**
  - Fields: `menucard_id`, `category_id`, `sort_index`, `created_at`
  - Relations: Composite PK referencing `menucards.id` and `categories.id`

- **`modifier_groups`**
  - Fields: `id` (uuid, PK), `name` (unique), `description`, `min_select`, `max_select`, `sort_index`, `active`, `created_at`, `updated_at`
  - Relations: Referenced by `modifiers.group_id`, `product_modifier_groups.group_id`

- **`modifiers`**
  - Fields: `id` (uuid, PK), `group_id`, `name`, `description`, `kind` (add/remove), `price_delta`, `sort_index`, `active`, `created_at`, `updated_at`
  - Relations: References `modifier_groups.id`

- **`product_modifier_groups`**
  - Fields: `product_id`, `group_id`, `sort_index`, `is_required`, `created_at`
  - Relations: Composite PK referencing `products.id` and `modifier_groups.id`

### Business Management Tables
- **`companies`**
  - Fields: `id` (uuid, PK), `name`, `cvr` (8 chars), `address`, `city`, `postal_code` (4 chars), `country`, `phone`, `email`, `website`, `vat_number`, `logo_url`, `receipt_message`, `created_at`, `updated_at`
  - Relations: Referenced by `user_profiles.company_id`, `payment_logs.company_id`, `audit_logs.company_id`

- **`user_profiles`**
  - Fields: `id` (uuid, PK, references auth.users), `company_id`, `role` (admin/manager/cashier), `first_name`, `last_name`, `created_at`, `updated_at`
  - Relations: References `companies.id`, `auth.users.id`

### Sales & Orders Tables
- **`orders`**
  - Fields: `id` (uuid, PK), `table_id`, `order_number` (unique), `status`, `total_amount`, `tax_amount`, `discount_amount`, `tip_amount`, `payment_method`, `customer_count`, `notes`, `created_at`, `updated_at`, `completed_at`, `paid_at`
  - Relations: Referenced by `order_items.order_id`, `payment_logs.order_id`

- **`order_items`**
  - Fields: `id` (uuid, PK), `order_id`, `product_id`, `category_id`, `quantity`, `unit_price`, `total_price`, `modifiers_total`, `special_instructions`, `created_at`, `product_name`, `category_name`, `category_path`
  - Relations: References `orders.id`, `products.id`, `categories.id`

- **`order_item_modifiers`**
  - Fields: `id` (uuid, PK), `order_item_id`, `modifier_group_id`, `modifier_id`, `modifier_name`, `modifier_group_name`, `price`, `quantity`, `created_at`
  - Relations: References `order_items.id`

### Payment & Financial Tables
- **`payment_logs`**
  - Fields: `id` (uuid, PK), `company_id`, `order_id`, `payment_method`, `amount`, `currency`, `status`, `transaction_reference`, `processed_by`, `processed_at`, `gateway_response`, `created_at`, `updated_at`
  - Relations: References `companies.id`, `orders.id`, `auth.users.id`

### Gift Cards & Customer Management
- **`gift_cards`**
  - Fields: `id` (uuid, PK), `code` (unique), `balance`, `original_amount`, `status`, `expires_at`, `created_at`, `updated_at`, `created_by`, `notes`
  - Relations: Referenced by `gift_card_transactions.gift_card_id`

- **`gift_card_transactions`**
  - Fields: `id` (uuid, PK), `gift_card_id`, `transaction_type`, `amount`, `balance_after`, `order_id`, `created_at`, `created_by`, `notes`
  - Relations: References `gift_cards.id`

- **`customer_groups`**
  - Fields: `id` (uuid, PK), `name`, `description`, `discount_percentage`, `discount_amount`, `color`, `active`, `created_at`, `updated_at`, `created_by`
  - Relations: Referenced by `customer_group_members.customer_group_id`

- **`customer_group_members`**
  - Fields: `id` (uuid, PK), `customer_group_id`, `customer_name`, `customer_email`, `customer_phone`, `member_since`, `total_purchases`, `total_spent`, `last_purchase_at`, `active`, `notes`
  - Relations: References `customer_groups.id`

### Printer System Tables
- **`printer_profiles`**
  - Fields: `id` (uuid, PK), `company_id`, `name`, `display_name`, `printer_type`, `connection_string`, `brand`, `paper_width`, `supports_cut`, `cut_command_hex`, `cut_command_name`, `print_kitchen_receipts`, `print_customer_receipts`, `auto_print_on_order`, `auto_print_on_payment`, `is_active`, `is_default`, `last_test_at`, `last_test_result`, `created_at`, `updated_at`
  - Relations: Referenced by `printer_room_assignments.printer_id`, `printer_category_assignments.printer_id`

- **`printer_room_assignments`**
  - Fields: `id` (uuid, PK), `printer_id`, `room_id`, `assigned_at`
  - Relations: References `printer_profiles.id`

- **`printer_category_assignments`**
  - Fields: `id` (uuid, PK), `printer_id`, `category_id`, `created_at`
  - Relations: References `printer_profiles.id`

### Audit & Logging Tables
- **`audit_logs`**
  - Fields: `id` (uuid, PK), `company_id`, `user_id`, `table_name`, `operation`, `record_id`, `old_data`, `new_data`, `changed_fields`, `ip_address`, `user_agent`, `created_at`
  - Relations: References `companies.id`, `auth.users.id`

- **`user_activity_logs`**
  - Fields: `id` (uuid, PK), `company_id`, `user_id`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`, `session_id`, `created_at`
  - Relations: References `companies.id`, `auth.users.id`

### Reservation System Tables
- **`reservations`**
  - Fields: `id` (uuid, PK), `tenant_id`, `location_id`, `reservation_number` (unique), `customer_name`, `customer_phone`, `customer_email`, `customer_notes`, `party_size`, `reservation_date`, `reservation_time`, `duration_minutes`, `time_range`, `status`, `special_requests`, `dietary_restrictions`, `accessibility_needs`, `created_at`, `updated_at`, `created_by`, `confirmed_at`, `seated_at`, `completed_at`, `cancelled_at`, `source`, `metadata`
  - Relations: Referenced by `reservation_tables.reservation_id`

- **`reservation_tables`**
  - Fields: `id` (uuid, PK), `reservation_id`, `table_id`, `assigned_at`, `assigned_by`
  - Relations: References `reservations.id`

### Visual Customization Tables
- **`optimized_images`**
  - Fields: `id` (uuid, PK), `original_filename`, `file_hash` (unique), `file_size_bytes`, `mime_type`, `width`, `height`, `original_url`, `large_url`, `medium_url`, `small_url`, `thumbnail_url`, `uploaded_by`, `uploaded_at`, `usage_count`
  - Relations: References `auth.users.id`

### Views & RPC Functions
- **Views**: `v_menu_editor_products`, `menu_structure`, `product_modifiers_view`, `daily_category_sales`, `product_performance`
- **RPC Functions**: `upsert_product_with_prices`, `reorder_entities`, `get_current_company`, `create_company_with_user`, `get_category_hierarchy`, `get_products_by_category`

## 2. 🌐 API Endpoints

### Menu API (`/api/menu/*`)
- **`/api/menu/route.ts`** - Main router, redirects to specific endpoints
- **`/api/menu/unified/route.ts`** - New consolidated endpoint using `resource` and `action` parameters
- **`/api/menu?action=categories/route.ts`** - CRUD operations for categories
- **`/api/menu?action=products/route.ts`** - CRUD operations for products
- **`/api/menu?action=modifiers/route.ts`** - CRUD operations for modifiers
- **`/api/menu/pricing/route.ts`** - Pricing management
- **`/api/menu/menucards/route.ts`** - Menu card management
- **`/api/menu/product-groups/route.ts`** - Product group management
- **`/api/menu?action=categories/reorder`** - Category reordering
- **`/api/menu?action=products/reorder`** - Product reordering

### Authentication API (`/api/auth/*`)
- **`/api/auth/logout/route.ts`** - User logout endpoint

### CloudPRNT API (`/api/cloudprnt/*`)
- **`/api/cloudprnt/[printerId]/job/route.ts`** - Printer job management
- **`/api/cloudprnt/enqueue/route.ts`** - Print job queuing

### Reservations API (`/api/reservations/*`)
- **`/api/reservations/route.ts`** - Reservation management (feature-flagged)

### **Supabase Replacement Analysis**:
- **Direct Supabase calls possible**: Most CRUD operations could use Supabase client directly
- **API endpoints needed for**: Complex business logic, validation, file uploads, print job management
- **Recommendation**: Consolidate simple CRUD operations to use Supabase directly, keep APIs for complex operations

## 3. 🪝 Data-Fetching Hooks

### Supabase Client Usage
- **`useAuth.ts`** - ✅ Direct Supabase client for authentication
- **`useCompany.ts`** - ✅ Direct Supabase client for company data
- **`useConsolidatedMenu.ts`** - ❌ Uses unified API endpoint instead of direct Supabase calls
- **`useConsolidatedPayments.ts`** - ❌ Uses unified API endpoint instead of direct Supabase calls

### API Endpoint Usage
- **`useMenu.ts`** - ❌ Uses multiple API endpoints
- **`useMenuManagement.ts`** - ❌ Uses API endpoints
- **`useCatalog.ts`** - ❌ Uses repository layer
- **`usePayments.ts`** - ❌ Uses API endpoints
- **`usePaymentSystem.ts`** - ❌ Uses API endpoints

### **Supabase Usage Analysis**:
- **Direct Supabase**: Authentication, company data
- **API endpoints**: Menu management, payments, complex operations
- **Repository layer**: Some data access through repository pattern
- **Inconsistency**: Mixed approach - some hooks use Supabase directly, others use APIs

## 4. 🖥 Server Actions

### **No Server Actions Found**
- The project uses API routes instead of "use server" actions
- All server-side logic is handled through Next.js API routes
- No direct Supabase calls from server actions

## 5. ⚙️ Services/Utils in `lib/`

### Supabase Client
- **`lib/supabaseClient.ts`** - ✅ Centralized Supabase client configuration

### Repository Layer (Supabase Usage)
- **`lib/repos/catalog.repo.ts`** - ✅ Direct Supabase calls for categories/products
- **`lib/repos/menucards.repo.ts`** - ✅ Direct Supabase calls for menu cards
- **`lib/repos/modifiers.repo.ts`** - ✅ Direct Supabase calls for modifiers
- **`lib/repos/pricing.repo.ts`** - ✅ Direct Supabase calls for pricing
- **`lib/repos/reorder.repo.ts`** - ✅ Direct Supabase calls for reordering
- **`lib/repos/printer.consolidated.repo.ts`** - ❌ Uses API endpoints instead of direct Supabase calls

### Mock Data & Utilities
- **`lib/mockModifiers.ts`** - ❌ Mock data instead of Supabase
- **`lib/menuData.ts`** - ❌ Mock data instead of Supabase
- **`lib/testPaymentSystem.ts`** - ❌ Test utilities instead of Supabase

### **Supabase Usage Analysis**:
- **Repository layer**: Most repositories use Supabase directly ✅
- **Consolidated printer repo**: Uses API endpoints instead of Supabase ❌
- **Mock data**: Several files contain mock data instead of using Supabase ❌
- **Recommendation**: Convert mock data to use Supabase, ensure all repositories use direct Supabase calls

## 6. 🧩 Context Providers

### Language Context
- **`contexts/LanguageContext.tsx`** - ❌ No Supabase data handling, only localStorage
- **`components/ui/dialog.tsx`** - ❌ UI component, no Supabase usage
- **`proposals/components/SmoothNavigation.v1.tsx`** - ❌ Proposal component, no Supabase usage

### **Supabase Usage Analysis**:
- **No Supabase integration**: Context providers don't handle Supabase data
- **Missing**: User context, company context, menu context, order context
- **Recommendation**: Create context providers for Supabase data to avoid prop drilling

## 7. 💳 Payment Functions & Tables

### Payment Tables
- **`payment_logs`** - Main payment tracking table
- **`orders`** - Contains payment status and method
- **`gift_cards`** - Gift card management
- **`gift_card_transactions`** - Gift card transaction history

### Payment Functions
- **`record_payment`** - RPC function for recording payments
- **`process_payment`** - RPC function for payment processing
- **Payment hooks**: `useConsolidatedPayments`, `usePayments`, `usePaymentSystem`

### **Payment ID Storage**:
- **Payment IDs**: Stored in `payment_logs.id` (UUID)
- **Order IDs**: Stored in `orders.id` (UUID)
- **Transaction IDs**: Stored in `gift_card_transactions.id` (UUID)
- **All data ends in Supabase**: ✅ Yes, all payment data is properly stored in Supabase tables

## 8. 📝 Types & Interfaces vs Supabase Schema

### Type Definitions
- **`lib/types/standardized.ts`** - Comprehensive standardized types
- **`lib/types/menu.ts`** - Menu-specific types
- **`lib/types/printer.ts`** - Printer types
- **`lib/types/printer.enhanced.ts`** - Enhanced printer types

### Schema Comparison
- **Menu types**: ✅ Match Supabase schema (categories, products, modifiers, etc.)
- **Payment types**: ✅ Match Supabase schema (payment methods, status, etc.)
- **Order types**: ✅ Match Supabase schema (order status, items, etc.)
- **Printer types**: ✅ Match Supabase schema (printer profiles, assignments, etc.)

### **Type Consistency Analysis**:
- **Well-aligned**: Types generally match Supabase schema
- **Standardized**: New `standardized.ts` file consolidates all types
- **Recommendation**: Continue using standardized types, ensure all new fields are added to types

## 9. ⚠️ Duplicates, Inconsistencies & Data Flow Issues

### Duplicate Endpoints
- **Menu API**: Both `/api/menu/route.ts` and `/api/menu/unified/route.ts` exist
- **Printer repos**: Three printer repository files with overlapping functionality
- **Payment hooks**: Multiple payment hooks with similar functionality

### Inconsistent Supabase Usage
- **Direct Supabase**: `useAuth`, `useCompany`, repository layer
- **API endpoints**: Menu management, payments, consolidated hooks
- **Mixed approach**: Some operations use Supabase directly, others go through APIs

### Data Not Ending in Supabase
- **Mock data**: `mockModifiers.ts`, `menuData.ts` contain static data
- **Local storage**: Language preferences stored in localStorage instead of Supabase
- **Test files**: `testPaymentSystem.ts` contains test data instead of real Supabase data

### **Critical Issues Identified**:

1. **Duplicate API Structure**: Both old menu API and new unified API exist
2. **Inconsistent Data Access**: Some hooks use Supabase directly, others use APIs
3. **Mock Data**: Several files contain mock data instead of using Supabase
4. **Repository Overlap**: Multiple printer repositories with similar functionality
5. **Missing Context**: No Supabase data context providers

### **Recommendations**:

1. **Consolidate APIs**: Remove old menu API, use only unified API
2. **Standardize Data Access**: Use direct Supabase calls for simple CRUD, APIs for complex operations
3. **Remove Mock Data**: Convert all mock data to use Supabase
4. **Consolidate Repositories**: Merge overlapping printer repositories
5. **Create Context Providers**: Add Supabase data context providers for user, company, menu data
6. **Data Flow**: Establish clear pattern: Supabase → Repository → Hook → Component

### **Data Flow Pattern**:
```
Supabase Tables → Repository Layer → React Query Hooks → Context Providers → Components
     ↓                    ↓              ↓                ↓              ↓
  Database           Data Access     State Mgmt      Global State    UI Rendering
```

This audit reveals that while the project has a solid Supabase foundation, there are inconsistencies in data access patterns and some duplicate functionality that should be consolidated for better maintainability and performance.
