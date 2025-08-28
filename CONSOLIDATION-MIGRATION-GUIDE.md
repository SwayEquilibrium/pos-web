# CONSOLIDATION MIGRATION GUIDE

## 🎯 **Overview**

This guide explains how to migrate from the old duplicate systems to the new consolidated architecture. The consolidation addresses the major issues identified in the audit:

1. **API Endpoint Duplication** → Single unified API
2. **Hook Duplication** → Consolidated hooks with clear responsibilities
3. **Repository Duplication** → Single repository per domain
4. **Type Inconsistencies** → Standardized type definitions
5. **Feature Flag Confusion** → Clear boundaries and usage

## 🚀 **Phase 1: API Consolidation**

### Before (Duplicate APIs)
```typescript
// Old way - multiple endpoints for same data
const categories1 = await fetch('/api/menu?action=categories')
const categories2 = await fetch('/api/menu?action=categories')
const categories3 = await fetch('/api/menu?action=categories/list')
```

### After (Unified API)
```typescript
// New way - single unified endpoint
const categories = await fetch('/api/menu?action=categories&list')
const category = await fetch('/api/menu?action=categories&get&id=uuid')
const newCategory = await fetch('/api/menu?action=categories&create', {
  method: 'POST',
  body: JSON.stringify(categoryData)
})
```

### Migration Steps
1. **Update API calls** to use `/api/menu/unified` endpoint
2. **Replace action parameters** with `resource` and `action`
3. **Remove old endpoint calls** from components
4. **Test all CRUD operations** work with new API

## 🪝 **Phase 2: Hook Consolidation**

### Before (Duplicate Hooks)
```typescript
// Old way - multiple hooks for same functionality
import { useMenu } from '@/hooks/useMenu'
import { useMenuManagement } from '@/hooks/useMenuManagement'
import { useCatalog } from '@/hooks/useCatalog'

// Confusing which one to use
const { categories } = useMenu()
const { createCategory } = useMenuManagement()
const { products } = useCatalog()
```

### After (Consolidated Hooks)
```typescript
// New way - single consolidated hook
import { 
  useCategories, 
  useCreateCategory, 
  useProducts 
} from '@/hooks/useConsolidatedMenu'

// Clear, single source of truth
const { data: categories, isLoading } = useCategories()
const createCategory = useCreateCategory()
const { data: products } = useProducts()
```

### Migration Steps
1. **Replace imports** with consolidated hook imports
2. **Update hook usage** to match new API
3. **Remove old hook files** after migration
4. **Update components** to use new hook structure

### Hook Mapping
| Old Hook | New Hook | Notes |
|-----------|----------|-------|
| `useMenu` | `useConsolidatedMenu` | Main menu operations |
| `useMenuManagement` | `useConsolidatedMenu` | CRUD operations |
| `useCatalog` | `useConsolidatedMenu` | Data fetching |
| `usePayments` | `useConsolidatedPayments` | Payment operations |
| `usePaymentSystem` | `useConsolidatedPayments` | Advanced payments |
| `usePrinters` | `useConsolidatedPrinters` | Printer management |

## 🗄️ **Phase 3: Repository Consolidation**

### Before (Duplicate Repositories)
```typescript
// Old way - multiple printer repositories
import { getPrinters } from '@/lib/repos/printer.repo'
import { getPrinters as getEnhancedPrinters } from '@/lib/repos/printers.repo'
import { getPrinters as getSimplePrinters } from '@/lib/repos/printers.repo'

// Confusing which one to use
const printers1 = await getPrinters()
const printers2 = await getEnhancedPrinters()
const printers3 = await getSimplePrinters()
```

### After (Consolidated Repository)
```typescript
// New way - single consolidated repository
import { 
  getPrinters, 
  createPrinter, 
  printReceipt 
} from '@/lib/repos/printers.repo'

// Clear, single source of truth
const printers = await getPrinters()
const newPrinter = await createPrinter(printerConfig)
const result = await printReceipt(printerId, receiptData)
```

### Migration Steps
1. **Update imports** to use consolidated repositories
2. **Replace function calls** with new consolidated functions
3. **Remove old repository files** after migration
4. **Update error handling** to match new error structure

### Repository Mapping
| Old Repository | New Repository | Notes |
|----------------|----------------|-------|
| `printer.repo.ts` | `printer.consolidated.repo.ts` | All printer operations |
| `printer.enhanced.repo.ts` | `printer.consolidated.repo.ts` | Advanced features included |
| `printer.simple.repo.ts` | `printer.consolidated.repo.ts` | Simplified interface included |
| `catalog.repo.ts` | `catalog.consolidated.repo.ts` | Menu catalog operations |
| `menucards.repo.ts` | `catalog.consolidated.repo.ts` | Menucard operations included |

## 📝 **Phase 4: Type Standardization**

### Before (Inconsistent Types)
```typescript
// Old way - inconsistent type definitions
interface PaymentTransaction {
  payment_method: string // Inconsistent naming
  price_delta: number    // Some use price_adjustment
  sort_index: number     // Mix of sort_index and print_sort_index
}

// Different interfaces for same concept
interface TableOrder { /* ... */ }
interface TakeawayOrder { /* ... */ }
interface KDSOrder { /* ... */ }
```

### After (Standardized Types)
```typescript
// New way - standardized type definitions
import { 
  PaymentTransaction, 
  PaymentMethod, 
  Order, 
  TableOrder, 
  TakeawayOrder 
} from '@/lib/types/standardized'

// Consistent, standardized types
const payment: PaymentTransaction = {
  payment_method: 'CASH' as PaymentMethod, // Standardized enum
  // ... other fields
}

// Clear inheritance hierarchy
const tableOrder: TableOrder = { /* extends Order */ }
const takeawayOrder: TakeawayOrder = { /* extends Order */ }
```

### Migration Steps
1. **Update imports** to use standardized types
2. **Replace type definitions** with new standardized interfaces
3. **Update component props** to match new types
4. **Fix type errors** and ensure consistency

### Type Mapping
| Old Type | New Type | Notes |
|----------|----------|-------|
| `payment_method: string` | `payment_method: PaymentMethod` | Standardized enum |
| `price_adjustment` | `price_delta` | Consistent naming |
| `sort_index` | `sort_index` | Single sort field |
| `TableOrder` | `TableOrder extends Order` | Clear inheritance |
| `TakeawayOrder` | `TakeawayOrder extends Order` | Clear inheritance |

## 🚩 **Phase 5: Feature Flag Clarification**

### Before (Confusing Flags)
```typescript
// Old way - unclear feature boundaries
const flags = {
  reservationsV1: true,    // But implementation exists in proposals
  paymentsV1: true,        // Multiple payment systems
  printerWebPRNTV1: true,  // Multiple printer systems
  // ... unclear what each flag controls
}
```

### After (Clear Flag Boundaries)
```typescript
// New way - clear feature boundaries
const flags = {
  // Core features
  unifiedMenuV1: true,           // New unified menu system
  consolidatedPaymentsV1: true,   // New consolidated payment system
  consolidatedPrintersV1: true,   // New consolidated printer system
  
  // Legacy features (deprecated)
  paymentsV1: false,              // Old payment system
  printerWebPRNTV1: false,        // Old printer system
  
  // Future features
  fulfillmentV1: false,           // Not yet implemented
  reservationsV1: false,          // Not yet implemented
}
```

### Migration Steps
1. **Update feature flags** to use new consolidated flags
2. **Remove deprecated flags** after migration
3. **Update flag checks** in components
4. **Document flag usage** for future development

## 🔄 **Migration Timeline**

### Week 1: API Consolidation
- [ ] Deploy new unified API endpoint
- [ ] Update frontend API calls
- [ ] Test all CRUD operations
- [ ] Remove old API endpoints

### Week 2: Hook Consolidation
- [ ] Deploy new consolidated hooks
- [ ] Update component imports
- [ ] Test all hook functionality
- [ ] Remove old hook files

### Week 3: Repository Consolidation
- [ ] Deploy new consolidated repositories
- [ ] Update service layer imports
- [ ] Test all repository functions
- [ ] Remove old repository files

### Week 4: Type Standardization
- [ ] Deploy new standardized types
- [ ] Update component type definitions
- [ ] Fix all type errors
- [ ] Remove old type files

### Week 5: Feature Flag Cleanup
- [ ] Update feature flag configuration
- [ ] Remove deprecated flags
- [ ] Update flag documentation
- [ ] Final testing and cleanup

## 🧪 **Testing Strategy**

### API Testing
```typescript
// Test unified API endpoints
describe('Unified Menu API', () => {
  it('should list categories', async () => {
    const response = await fetch('/api/menu?action=categories&list')
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.data).toBeDefined()
  })
  
  it('should create category', async () => {
    const response = await fetch('/api/menu?action=categories&create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Category' })
    })
    expect(response.ok).toBe(true)
  })
})
```

### Hook Testing
```typescript
// Test consolidated hooks
describe('Consolidated Menu Hooks', () => {
  it('should fetch categories', () => {
    const { result } = renderHook(() => useCategories())
    expect(result.current.isLoading).toBe(true)
    waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })
})
```

### Repository Testing
```typescript
// Test consolidated repositories
describe('Consolidated Printer Repository', () => {
  it('should get printers', async () => {
    const printers = await getPrinters()
    expect(Array.isArray(printers)).toBe(true)
  })
  
  it('should print receipt', async () => {
    const result = await printReceipt(printerId, receiptData)
    expect(result.success).toBeDefined()
  })
})
```

## ⚠️ **Breaking Changes**

### API Changes
- **Old**: `/api/menu?action=categories`
- **New**: `/api/menu?action=categories&list`
- **Impact**: All API calls need updating

### Hook Changes
- **Old**: `useMenu()`
- **New**: `useCategories()`, `useProducts()`, etc.
- **Impact**: All component imports need updating

### Type Changes
- **Old**: `payment_method: string`
- **New**: `payment_method: PaymentMethod`
- **Impact**: All type definitions need updating

### Repository Changes
- **Old**: `import { getPrinters } from '@/lib/repos/printer.repo'`
- **New**: `import { getPrinters } from '@/lib/repos/printers.repo'`
- **Impact**: All service layer imports need updating

## 🔧 **Rollback Plan**

If issues arise during migration:

1. **Revert feature flags** to enable old systems
2. **Keep old endpoints** running alongside new ones
3. **Maintain old hooks** for emergency fallback
4. **Document issues** for future migration attempts

## 📚 **Documentation Updates**

After successful migration:

1. **Update API documentation** with new unified endpoints
2. **Update component documentation** with new hook usage
3. **Update service documentation** with new repository functions
4. **Create migration examples** for future reference

## 🎉 **Benefits After Migration**

### Code Quality
- **Single source of truth** for each domain
- **Consistent API patterns** across the system
- **Standardized type definitions** eliminate confusion
- **Clear feature boundaries** prevent duplication

### Developer Experience
- **Easier to understand** which hook/API to use
- **Consistent error handling** across the system
- **Better TypeScript support** with standardized types
- **Clearer documentation** and examples

### Maintenance
- **Easier to maintain** single implementations
- **Faster bug fixes** with clear code paths
- **Simpler testing** with consolidated systems
- **Better performance** with optimized queries

### Future Development
- **Clearer architecture** for new features
- **Easier to extend** existing functionality
- **Better code reuse** across components
- **Simpler onboarding** for new developers

## 🆘 **Support & Questions**

If you encounter issues during migration:

1. **Check the audit document** (`AUDIT.md`) for context
2. **Review the consolidated code** for examples
3. **Test with the new unified API** endpoints
4. **Use the new consolidated hooks** as reference
5. **Consult the standardized types** for consistency

The consolidation effort will result in a much cleaner, more maintainable codebase that's easier to work with and extend in the future.
