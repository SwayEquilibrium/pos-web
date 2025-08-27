// ================================================
// PRODUCTS HOOKS
// React Query hooks for product operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as catalogRepo from '@/lib/repos/catalog.repo'
import * as pricingRepo from '@/lib/repos/pricing.repo'
import type { ProductWithPricing, UpsertProductParams } from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const productKeys = {
  all: ['products'] as const,
  byCategory: (categoryId: string) => ['products', 'category', categoryId] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  pricing: (id: string) => ['products', 'pricing', id] as const
}

// ================================================
// QUERIES
// ================================================

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: catalogRepo.getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useProductsByCategory(categoryId?: string | null) {
  return useQuery({
    queryKey: productKeys.byCategory(categoryId || ''),
    queryFn: () => categoryId ? catalogRepo.getProductsByCategory(categoryId) : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useProduct(id?: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id || ''),
    queryFn: () => id ? catalogRepo.getProduct(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useProductPricing(productId?: string | null) {
  return useQuery({
    queryKey: productKeys.pricing(productId || ''),
    queryFn: () => productId ? pricingRepo.getProductPricingByContext(productId) : Promise.resolve({ dine_in: null, takeaway: null }),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes (pricing changes more frequently)
    cacheTime: 5 * 60 * 1000
  })
}

// ================================================
// MUTATIONS
// ================================================

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: catalogRepo.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      
      if (newProduct.category_id) {
        queryClient.invalidateQueries({ 
          queryKey: productKeys.byCategory(newProduct.category_id) 
        })
      }

      toast.success('Product created successfully')
    },
    onError: (error) => {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProductWithPricing> }) =>
      catalogRepo.updateProduct(id, updates),
    onSuccess: (updatedProduct) => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      
      if (updatedProduct.category_id) {
        queryClient.invalidateQueries({ 
          queryKey: productKeys.byCategory(updatedProduct.category_id) 
        })
      }

      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      )

      toast.success('Product updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: catalogRepo.deleteProduct,
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      
      toast.success('Product deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  })
}

// ================================================
// PRICING MUTATIONS
// ================================================

export function useUpsertProductWithPrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pricingRepo.upsertProductWithPrices,
    onSuccess: (productId: string) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.pricing(productId) })

      toast.success('Product saved successfully')
    },
    onError: (error) => {
      console.error('Error saving product with prices:', error)
      toast.error('Failed to save product')
    }
  })
}

export function useUpsertProductPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pricingRepo.upsertProductPrice,
    onSuccess: (updatedPrice) => {
      // Invalidate pricing queries
      queryClient.invalidateQueries({ 
        queryKey: productKeys.pricing(updatedPrice.product_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: productKeys.detail(updatedPrice.product_id) 
      })

      toast.success('Price updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product price:', error)
      toast.error('Failed to update price')
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useProductEditor(productId?: string | null) {
  const productQuery = useProduct(productId)
  const pricingQuery = useProductPricing(productId)
  const upsertMutation = useUpsertProductWithPrices()

  const saveProduct = (data: UpsertProductParams) => {
    return upsertMutation.mutateAsync({
      ...data,
      product_id: productId || null
    })
  }

  return {
    product: productQuery.data,
    pricing: pricingQuery.data,
    isLoading: productQuery.isLoading || pricingQuery.isLoading,
    isError: productQuery.isError || pricingQuery.isError,
    error: productQuery.error || pricingQuery.error,
    saveProduct,
    isSaving: upsertMutation.isPending,
    refetch: () => {
      productQuery.refetch()
      pricingQuery.refetch()
    }
  }
}

// ================================================
// SEARCH AND FILTER HOOKS
// ================================================

export function useProductSearch(searchTerm?: string, categoryId?: string | null) {
  const { data: allProducts = [] } = useProducts()

  return useQuery({
    queryKey: ['products', 'search', searchTerm, categoryId],
    queryFn: () => {
      let filtered = allProducts

      // Filter by category if specified
      if (categoryId) {
        filtered = filtered.filter(product => product.category_id === categoryId)
      }

      // Filter by search term if specified
      if (searchTerm && searchTerm.length > 0) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)) ||
          (product.category_name && product.category_name.toLowerCase().includes(term))
        )
      }

      return filtered
    },
    enabled: allProducts.length > 0,
    staleTime: 30 * 1000 // 30 seconds for search results
  })
}

// ================================================
// BULK OPERATIONS
// ================================================

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      // Delete products one by one (could be optimized with a bulk repo function)
      for (const id of productIds) {
        await catalogRepo.deleteProduct(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Products deleted successfully')
    },
    onError: (error) => {
      console.error('Error bulk deleting products:', error)
      toast.error('Failed to delete products')
    }
  })
}

export function useBulkUpdateProductPrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pricingRepo.bulkUpdateProductPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Prices updated successfully')
    },
    onError: (error) => {
      console.error('Error bulk updating prices:', error)
      toast.error('Failed to update prices')
    }
  })
}
