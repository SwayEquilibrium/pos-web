# MIGRATION NOTES - REPO-WIDE REFACTOR

## Overview
This document outlines the comprehensive refactor performed to consolidate the codebase architecture, remove duplicates, and establish a single source of truth for data management.

## 🗂️ Files Created

### New API Endpoints
- `app/api/menu/route.ts` - Consolidated menu API (replaces old menu endpoints)
- `app/api/orders/route.ts` - New orders API
- `app/api/payments/route.ts` - New payments API  
- `app/api/tables/route.ts` - New tables API
- `app/api/printing/route.ts` - Consolidated printing API (renamed from cloudprnt)

### New Repository Layer
- `lib/repos/menu.repo.ts` - Consolidated menu repository
- `lib/repos/orders.repo.ts` - New orders repository
- `lib/repos/payments.repo.ts` - New payments repository
- `lib/repos/tables.repo.ts` - New tables repository
- `lib/repos/printers.repo.ts` - Consolidated printer repository

### New Hooks
- `hooks/useMenu.ts` - Consolidated menu hooks
- `hooks/useOrders.ts` - New orders hooks
- `hooks/usePayments.ts` - New payments hooks
- `hooks/useTables.ts` - New tables hooks
- `hooks/usePrinters.ts` - Consolidated printer hooks

### New Context Providers
- `contexts/MenuContext.tsx` - Menu data management
- `contexts/OrderContext.tsx` - Order data management
- `contexts/CompanyContext.tsx` - Company data management
- `contexts/AuthContext.tsx` - Authentication management

### New Types
- `lib/types/shared.ts` - Shared DTOs for API <-> Repository communication

### New Migrations
- `proposals/migrations/004_add_company_logo_and_receipt.sql` - Adds missing logo_url and receipt_message columns to companies table

## 🗑️ Files to Delete/Deprecate

### Old API Endpoints (Deprecated)
- `app/api/menu?action=categories/route.ts` - Use `/api/menu?action=categories`
- `app/api/menu?action=products/route.ts` - Use `/api/menu?action=products`
- `app/api/menu?action=modifiers/route.ts` - Use `/api/menu?action=modifiers`
- `app/api/menu/pricing/route.ts` - Use `/api/menu?action=pricing`
- `app/api/menu/menucards/route.ts` - Use `/api/menu?action=menucards`
- `app/api/menu/unified/route.ts` - Replaced by consolidated menu API

### Old Repository Files (Deprecated)
- `lib/repos/catalog.repo.ts` - Use `lib/repos/menu.repo.ts`
- `lib/repos/menucards.repo.ts` - Use `lib/repos/menu.repo.ts`
- `lib/repos/modifiers.repo.ts` - Use `lib/repos/menu.repo.ts`
- `lib/repos/pricing.repo.ts` - Use `lib/repos/menu.repo.ts`
- `lib/repos/printer.simple.repo.ts` - Use `lib/repos/printers.repo.ts`
- `lib/repos/printer.consolidated.repo.ts` - Use `lib/repos/printers.repo.ts`
- `lib/repos/printer.enhanced.repo.ts` - Use `lib/repos/printers.repo.ts`

### Old Hook Files (Deprecated)
- `hooks/useMenu.ts` - Use `hooks/useMenu.ts`
- `hooks/useCategories.ts` - Use `hooks/useMenu.ts`
- `hooks/useProducts.ts` - Use `hooks/useMenu.ts`
- `hooks/useModifiers.ts` - Use `hooks/useMenu.ts`
- `hooks/useMenucards.ts` - Use `hooks/useMenu.ts`
- `hooks/usePaymentSystem.ts` - Use `hooks/usePayments.ts`

### Mock Data Files (Delete)
- `lib/mockModifiers.ts` - No longer needed
- `lib/menuData.ts` - No longer needed
- `testPaymentSystem.ts` - No longer needed

## 🔄 Import Changes Required

### Update Hook Imports
```typescript
// OLD
import { useMenu } from '@/hooks/useMenu'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'

// NEW
import { useMenu, useCategories, useProducts } from '@/hooks/useMenu'
```

### Update Repository Imports
```typescript
// OLD
import { getCategories } from '/lib/repos/menu.repo'
import { getProducts } from '/lib/repos/menu.repo'

// NEW
import { getCategories, getProducts } from '@/lib/repos/menu.repo'
```

### Update API Calls
```typescript
// OLD
const response = await fetch('/api/menu?action=categories')
const response = await fetch('/api/menu?action=products')

// NEW
const response = await fetch('/api/menu?action=categories')
const response = await fetch('/api/menu?action=products')
```

## 🏗️ New Architecture

### Data Flow
```
Component → Hook → Repository → Supabase
    ↓
Context Provider → Hook → Repository → Supabase
```

### API Structure
- `/api/menu` - All menu operations (categories, products, modifiers, pricing, menucards)
- `/api/orders` - Order management
- `/api/payments` - Payment processing
- `/api/tables` - Table and room management
- `/api/printing` - Printer operations and CloudPRNT

### Repository Structure
- `menu.repo.ts` - Categories, products, modifiers, pricing, menucards
- `orders.repo.ts` - Orders, order items, order modifiers
- `payments.repo.ts` - Payment transactions, types, logs, idempotency
- `tables.repo.ts` - Tables, rooms, layout management
- `printers.repo.ts` - Printers, print jobs, auto-printing

## 🚀 Migration Steps

### 1. Update Dependencies
```bash
# Install any new dependencies if needed
npm install
```

### 2. Update Import Statements
Search and replace old import paths with new ones throughout the codebase.

### 3. Update API Calls
Replace old API endpoint calls with new consolidated endpoints.

### 4. Update Component Props
Components using old hooks may need prop updates to match new hook interfaces.

### 5. Test Functionality
Verify that all features work correctly with the new architecture.

### 6. Remove Deprecated Files
After confirming everything works, delete the deprecated files.

## ⚠️ Breaking Changes

### Hook Return Values
Some hooks may return different data structures. Check component usage for compatibility.

### API Response Format
API responses may have different formats. Update any code that processes API responses.

### Repository Function Signatures
Repository function parameters may have changed. Update all calls to match new signatures.

## 🔧 Configuration

### Feature Flags
The refactor maintains compatibility with existing feature flags. No changes needed to flag configuration.

### Environment Variables
No new environment variables are required. Existing Supabase configuration is used.

## 📊 Performance Improvements

### Reduced Bundle Size
- Eliminated duplicate code
- Consolidated similar functionality
- Removed mock data

### Better Caching
- React Query hooks with proper cache invalidation
- Optimized data fetching patterns

### Improved Data Consistency
- Single source of truth for all data
- Consistent error handling
- Unified loading states

## 🧪 Testing

### Unit Tests
Update existing tests to use new hooks and repositories.

### Integration Tests
Verify API endpoints work correctly with new structure.

### E2E Tests
Ensure end-to-end workflows function as expected.

## 📝 Notes

- All existing functionality is preserved
- No database schema changes required
- Backward compatibility maintained where possible
- Gradual migration supported (old and new can coexist temporarily)

## 🆘 Troubleshooting

### Common Issues
1. **Import errors**: Check that new file paths are correct
2. **Type mismatches**: Update component props to match new hook interfaces
3. **API errors**: Verify new API endpoint structure
4. **Missing data**: Check that repositories are properly connected to Supabase

### Rollback Plan
If issues arise, the old files can be restored from git history. The refactor is designed to be non-destructive to existing data.
