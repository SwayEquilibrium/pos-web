'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Enhanced categories hook with better error handling and debugging
export function useCategoriesEnhanced() {
  return useQuery({
    queryKey: ['categories-enhanced'],
    queryFn: async () => {
      console.log('[useCategoriesEnhanced] Fetching categories...')
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id,name,parent_id,sort_index,print_sort_index,color,emoji,display_style,image_url,image_thumbnail_url,active')
          .order('sort_index')
        
        if (error) {
          console.error('[useCategoriesEnhanced] Database error:', error)
          
          // Check if table doesn't exist
          if (error.message?.includes('relation "public.categories" does not exist')) {
            console.warn('[useCategoriesEnhanced] Categories table does not exist - database setup required')
            return []
          }
          
          throw new Error(`Failed to fetch categories: ${error.message}`)
        }

        console.log('[useCategoriesEnhanced] Successfully fetched categories:', data?.length || 0)
        console.log('[useCategoriesEnhanced] Categories data:', data)
        
        return data ?? []
      } catch (err) {
        console.error('[useCategoriesEnhanced] Unexpected error:', err)
        throw err
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if table doesn't exist
      if (error?.message?.includes('does not exist')) {
        return false
      }
      return failureCount < 3
    }
  })
}

// Enhanced products hook with better error handling and debugging
export function useProductsByCategoryEnhanced(categoryId?: string) {
  return useQuery({
    queryKey: ['products-enhanced', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      console.log('[useProductsByCategoryEnhanced] Fetching products for category:', categoryId)
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,description,price,is_open_price,options_schema,color,emoji,display_style,image_url,image_thumbnail_url,category_id,active,created_at,updated_at')
          .eq('category_id', categoryId)
          .eq('active', true)
          .order('name')
        
        if (error) {
          console.error('[useProductsByCategoryEnhanced] Database error:', error)
          
          // Check if table doesn't exist
          if (error.message?.includes('relation "public.products" does not exist')) {
            console.warn('[useProductsByCategoryEnhanced] Products table does not exist - database setup required')
            return []
          }
          
          throw new Error(`Failed to fetch products: ${error.message}`)
        }

        console.log('[useProductsByCategoryEnhanced] Successfully fetched products:', data?.length || 0)
        console.log('[useProductsByCategoryEnhanced] Products data:', data)
        
        // Additional debugging - check if products exist but are inactive
        if (data?.length === 0) {
          console.log('[useProductsByCategoryEnhanced] No active products found, checking for inactive products...')
          
          const { data: inactiveData, error: inactiveError } = await supabase
            .from('products')
            .select('id,name,active')
            .eq('category_id', categoryId)
            .eq('active', false)
          
          if (!inactiveError && inactiveData?.length > 0) {
            console.warn('[useProductsByCategoryEnhanced] Found inactive products:', inactiveData)
            console.warn('[useProductsByCategoryEnhanced] These products exist but are marked as inactive!')
          }
        }
        
        return data ?? []
      } catch (err) {
        console.error('[useProductsByCategoryEnhanced] Unexpected error:', err)
        throw err
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if table doesn't exist
      if (error?.message?.includes('does not exist')) {
        return false
      }
      return failureCount < 3
    }
  })
}

// Hook to get all products (for debugging)
export function useAllProductsDebug() {
  return useQuery({
    queryKey: ['all-products-debug'],
    queryFn: async () => {
      console.log('[useAllProductsDebug] Fetching all products for debugging...')
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,category_id,active,created_at')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('[useAllProductsDebug] Database error:', error)
          return []
        }

        console.log('[useAllProductsDebug] All products in database:', data)
        
        // Group by category for easier debugging
        const byCategory = data?.reduce((acc, product) => {
          const catId = product.category_id || 'no-category'
          if (!acc[catId]) acc[catId] = []
          acc[catId].push(product)
          return acc
        }, {} as Record<string, any[]>)
        
        console.log('[useAllProductsDebug] Products grouped by category:', byCategory)
        
        return data ?? []
      } catch (err) {
        console.error('[useAllProductsDebug] Unexpected error:', err)
        return []
      }
    },
    staleTime: 10 * 1000, // 10 seconds (shorter for debugging)
  })
}

// Hook to verify database setup
export function useDatabaseVerification() {
  return useQuery({
    queryKey: ['database-verification'],
    queryFn: async () => {
      console.log('[useDatabaseVerification] Verifying database setup...')
      
      const results = {
        categoriesTable: false,
        productsTable: false,
        categoriesCount: 0,
        productsCount: 0,
        errors: [] as string[]
      }
      
      // Check categories table
      try {
        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('id')
          .limit(1)
        
        if (catError) {
          results.errors.push(`Categories table error: ${catError.message}`)
        } else {
          results.categoriesTable = true
          
          // Count total categories
          const { count } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
          
          results.categoriesCount = count || 0
        }
      } catch (err) {
        results.errors.push(`Categories table access failed: ${err}`)
      }
      
      // Check products table
      try {
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id')
          .limit(1)
        
        if (prodError) {
          results.errors.push(`Products table error: ${prodError.message}`)
        } else {
          results.productsTable = true
          
          // Count total products
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
          
          results.productsCount = count || 0
        }
      } catch (err) {
        results.errors.push(`Products table access failed: ${err}`)
      }
      
      console.log('[useDatabaseVerification] Verification results:', results)
      return results
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

// Hook to force refresh all catalog data
export function useRefreshCatalogData() {
  const queryClient = useQueryClient()
  
  return {
    refreshAll: () => {
      console.log('[useRefreshCatalogData] Forcing refresh of all catalog data...')
      
      // Invalidate all catalog-related queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-enhanced'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-enhanced'] })
      queryClient.invalidateQueries({ queryKey: ['all-products-debug'] })
      queryClient.invalidateQueries({ queryKey: ['database-verification'] })
      
      console.log('[useRefreshCatalogData] All catalog queries invalidated')
    },
    
    refreshProducts: (categoryId?: string) => {
      console.log('[useRefreshCatalogData] Refreshing products for category:', categoryId)
      
      if (categoryId) {
        queryClient.invalidateQueries({ queryKey: ['products', categoryId] })
        queryClient.invalidateQueries({ queryKey: ['products-enhanced', categoryId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['products-enhanced'] })
      }
    }
  }
}
