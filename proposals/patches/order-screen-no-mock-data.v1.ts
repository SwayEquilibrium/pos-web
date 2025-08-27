// Integration patch for order screen to eliminate mock data usage
// and provide clear feedback about missing data

import { enableMenuDataSync } from '../glue/menuDataSync.v1'

// Patch for app/orders/[tableId]/page.tsx
export const orderScreenPatch = {
  // Add imports for enhanced data handling
  imports: `
import { enableMenuDataSync, useCategoriesEnhanced, useProductsByCategoryEnhanced, useRefreshCatalogData } from '@/proposals/glue/menuDataSync.v1'
import OrderScreenDataAware from '@/proposals/components/OrderScreenDataAware.v1'
import MenuDataDebugger from '@/proposals/components/MenuDataDebugger.v1'
`,

  // Replace the data fetching hooks
  dataHooks: `
  // Enhanced data fetching with better error handling
  const { 
    data: cats, 
    isLoading: categoriesLoading, 
    error: categoriesError 
  } = enableMenuDataSync ? useCategoriesEnhanced() : useCategories()
  
  const { 
    data: prods, 
    isLoading: productsLoading, 
    error: productsError 
  } = enableMenuDataSync 
    ? useProductsByCategoryEnhanced(selectedCat === 'favorites' ? undefined : selectedCat)
    : useProductsByCategory(selectedCat === 'favorites' ? undefined : selectedCat)
  
  const { refreshAll, refreshProducts } = enableMenuDataSync ? useRefreshCatalogData() : { refreshAll: () => {}, refreshProducts: () => {} }
`,

  // Wrap the main content in data-aware component
  contentWrapper: `
  // Wrap content in data-aware component when enhanced mode is enabled
  if (enableMenuDataSync) {
    return (
      <>
        <OrderScreenDataAware
          categories={cats}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          products={prods}
          productsLoading={productsLoading}
          productsError={productsError}
          selectedCategory={selectedCat}
          onRefreshCategories={refreshAll}
          onRefreshProducts={() => refreshProducts(selectedCat)}
        >
          {/* Original order screen content goes here */}
          {/* ... existing JSX ... */}
        </OrderScreenDataAware>
        
        {/* Debug component in development */}
        {process.env.NODE_ENV === 'development' && (
          <MenuDataDebugger selectedCategory={selectedCat} />
        )}
      </>
    )
  }
`,

  // Feature flag configuration
  environmentVariable: 'NEXT_PUBLIC_MENU_DATA_SYNC_V1=true'
}

// Instructions for implementation
export const implementationInstructions = `
To implement this no-mock-data approach:

1. Enable the feature flag:
   Add to .env.local: NEXT_PUBLIC_MENU_DATA_SYNC_V1=true

2. The system will now:
   - Show clear error messages when database tables don't exist
   - Indicate when categories or products are missing
   - Provide direct links to create missing data
   - Never show mock/fake data
   - Give specific instructions on what to do

3. If you see "Database Setup Required":
   - Run the database migration scripts
   - Create the categories and products tables

4. If you see "No Categories Found":
   - Go to Menu Management
   - Create categories like "Hovedret", "Forret", etc.

5. If you see "No Products in Category":
   - Go to Menu Management
   - Add products to the selected category
   - Ensure products are marked as "active"

This approach eliminates all mock data and provides clear, actionable feedback about what's missing.
`
