import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ================================================
// UNIFIED MENU HOOK - SINGLE SOURCE OF TRUTH
// ================================================

// Query keys for React Query
export const unifiedMenuKeys = {
  all: ['unified-menu'] as const,
  categories: ['unified-menu', 'categories'] as const,
  products: ['unified-menu', 'products'] as const,
  menu: ['unified-menu', 'menu'] as const,
  modifiers: ['unified-menu', 'modifiers'] as const,
  pricing: ['unified-menu', 'pricing'] as const,
  category: (id: string) => ['unified-menu', 'categories', id] as const,
  menucard: (id: string) => ['unified-menu', 'menu', id] as const,
  menucards: ['unified-menu', 'menucards'] as const
}

// ================================================
// UNIFIED MENU DATA FETCHING
// ================================================

/**
 * Fetch all categories with hierarchy and product counts
 */
export function useCategories(options?: {
  categoryId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  const { categoryId, menucardId, includeInactive } = options || {}
  
  return useQuery({
    queryKey: unifiedMenuKeys.categories,
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'categories',
        ...(categoryId && { categoryId }),
        ...(menucardId && { menucardId }),
        ...(includeInactive && { includeInactive: 'true' })
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

/**
 * Fetch all products with pricing and modifiers
 */
export function useProducts(options?: {
  categoryId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  const { categoryId, menucardId, includeInactive } = options || {}
  
  return useQuery({
    queryKey: unifiedMenuKeys.products,
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'products',
        ...(categoryId && { categoryId }),
        ...(menucardId && { menucardId }),
        ...(includeInactive && { includeInactive: 'true' })
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Fetch complete menu structure for a specific menucard
 */
export function useMenu
  return useQuery({
    queryKey: unifiedMenuKeys.menucard(menucardId || 'default'),
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'menu',
        ...(menucardId && { menucardId })
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch menu')
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!menucardId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Fetch all modifiers with their groups
 */
export function useModifiers(options?: {
  includeInactive?: boolean
}) {
  const { includeInactive } = options || {}
  
  return useQuery({
    queryKey: unifiedMenuKeys.modifiers,
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'modifiers',
        ...(includeInactive && { includeInactive: 'true' })
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch modifiers')
      }
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Fetch pricing information for products
 */
export function useUnifiedPricing(options?: {
  categoryId?: string
  menucardId?: string
}) {
  const { categoryId, menucardId } = options || {}
  
  return useQuery({
    queryKey: unifiedMenuKeys.pricing,
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'pricing',
        ...(categoryId && { categoryId }),
        ...(menucardId && { menucardId })
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pricing')
      }
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// ================================================
// UNIFIED MENU MUTATIONS
// ================================================

/**
 * Create a new category
 */
export function useCreateUnifiedCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryData: {
      name: string
      description?: string
      parent_id?: string | null
      sort_index?: number
    }) => {
      const response = await fetch('/api/menu?action=categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create category')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all menu queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  })
}

/**
 * Update an existing category
 */
export function useUpdateUnifiedCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string
      updates: Partial<{
        name: string
        description: string
        parent_id: string | null
        sort_index: number
        active: boolean
      }>
    }) => {
      const response = await fetch(`/api/menu?action=categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update category')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Category updated successfully')
    },
    onError: (error) => {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  })
}

/**
 * Delete a category
 */
export function useDeleteUnifiedCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/menu?action=categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  })
}

/**
 * Reorder categories
 */
export function useReorderUnifiedCategories() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newOrder: string[]) => {
      const response = await fetch('/api/menu?action=categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder })
      })
      
      if (!response.ok) {
        throw new Error('Failed to reorder categories')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Categories reordered successfully')
    },
    onError: (error) => {
      console.error('Error reordering categories:', error)
      toast.error('Failed to reorder categories')
    }
  })
}

/**
 * Create a new product
 */
export function useCreateUnifiedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: {
      name: string
      category_id?: string
      product_group_id?: string
      description?: string
      sort_index?: number
      prices?: Array<{
        context: string
        price: number
        tax_code_id: string
      }>
    }) => {
      const response = await fetch('/api/menu?action=products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product created successfully')
    },
    onError: (error) => {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
    }
  })
}

/**
 * Update an existing product
 */
export function useUpdateUnifiedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updateData: {
      id: string
      updates: Partial<{
        name: string
        category_id: string
        product_group_id: string
        description: string
        sort_index: number
        active: boolean
      }>
      prices?: Array<{
        context: string
        price: number
        tax_code_id: string
      }>
    }) => {
      const response = await fetch('/api/menu?action=products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Failed to update product')
    }
  })
}

/**
 * Delete a product
 */
export function useDeleteUnifiedProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/menu?action=products?id=${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  })
}

/**
 * Reorder products within a category
 */
export function useReorderUnifiedProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      categoryId: string
      newOrder: string[]
    }) => {
      const response = await fetch('/api/menu?action=products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to reorder products')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Products reordered successfully')
    },
    onError: (error) => {
      console.error('Error reordering products:', error)
      toast.error('Failed to reorder products')
    }
  })
}

/**
 * Create a new modifier
 */
export function useCreateUnifiedModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (modifierData: {
      name: string
      description?: string
      price?: number
      modifier_group_id: string
      sort_index?: number
      active?: boolean
    }) => {
      const response = await fetch('/api/menu?action=modifiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifierData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create modifier')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier created successfully')
    },
    onError: (error) => {
      console.error('Error creating modifier:', error)
      toast.error('Failed to create modifier')
    }
  })
}

/**
 * Update an existing modifier
 */
export function useUpdateUnifiedModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string
      updates: Partial<{
        name: string
        description: string
        price: number
        modifier_group_id: string
        sort_index: number
        active: boolean
      }>
    }) => {
      const response = await fetch('/api/menu?action=modifiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update modifier')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier updated successfully')
    },
    onError: (error) => {
      console.error('Error updating modifier:', error)
      toast.error('Failed to update modifier')
    }
  })
}

/**
 * Delete a modifier
 */
export function useDeleteUnifiedModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (modifierId: string) => {
      const response = await fetch(`/api/menu?action=modifiers?id=${modifierId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete modifier')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting modifier:', error)
      toast.error('Failed to delete modifier')
    }
  })
}

/**
 * Create a new product group
 */
export function useCreateUnifiedProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (groupData: {
      name: string
      description?: string
      sort_index?: number
      active?: boolean
    }) => {
      const response = await fetch('/api/menu/product-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create product group')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product group created successfully')
    },
    onError: (error) => {
      console.error('Error creating product group:', error)
      toast.error('Failed to create product group')
    }
  })
}

/**
 * Update an existing product group
 */
export function useUpdateUnifiedProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string
      updates: Partial<{
        name: string
        description: string
        sort_index: number
        active: boolean
      }>
    }) => {
      const response = await fetch('/api/menu/product-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update product group')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product group updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product group:', error)
      toast.error('Failed to update product group')
    }
  })
}

/**
 * Delete a product group
 */
export function useDeleteUnifiedProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/menu/product-groups?id=${groupId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete product group')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product group deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting product group:', error)
      toast.error('Failed to delete product group')
    }
  })
}

/**
 * Create a new modifier group
 */
export function useCreateUnifiedModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (modifierData: {
      name: string
      type?: string
      description?: string
      sort_index?: number
      modifiers?: Array<{
        name: string
        price: number
        sort_index?: number
      }>
    }) => {
      const response = await fetch('/api/menu?action=modifiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifierData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create modifier group')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier group created successfully')
    },
    onError: (error) => {
      console.error('Error creating modifier group:', error)
      toast.error(error.message || 'Failed to create modifier group')
    }
  })
}

/**
 * Update an existing modifier group
 */
export function useUpdateUnifiedModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updateData: {
      id: string
      updates: Partial<{
        name: string
        type: string
        description: string
        sort_index: number
        active: boolean
      }>
      modifiers?: Array<{
        name: string
        price: number
        sort_index?: number
      }>
    }) => {
      const response = await fetch('/api/menu?action=modifiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update modifier group')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier group updated successfully')
    },
    onError: (error) => {
      console.error('Error updating modifier group:', error)
      toast.error(error.message || 'Failed to update modifier group')
    }
  })
}

/**
 * Delete a modifier group
 */
export function useDeleteUnifiedModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/menu?action=modifiers?id=${groupId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete modifier group')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Modifier group deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting modifier group:', error)
      toast.error(error.message || 'Failed to delete modifier group')
    }
  })
}

/**
 * Create or update product prices
 */
export function useUpdateUnifiedProductPricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pricingData: {
      productId: string
      prices: Array<{
        context: string
        price: number
        tax_code_id: string
      }>
    }) => {
      const response = await fetch('/api/menu/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product pricing')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Product pricing updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product pricing:', error)
      toast.error(error.message || 'Failed to update product pricing')
    }
  })
}

/**
 * Update individual price
 */
export function useUpdateUnifiedPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updateData: {
      priceId: string
      updates: Partial<{
        price: number
        tax_code_id: string
        context: string
      }>
    }) => {
      const response = await fetch('/api/menu/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update price')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Price updated successfully')
    },
    onError: (error) => {
      console.error('Error updating price:', error)
      toast.error(error.message || 'Failed to update price')
    }
  })
}

/**
 * Delete individual price
 */
export function useDeleteUnifiedPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch(`/api/menu/pricing?id=${priceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete price')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Price deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting price:', error)
      toast.error(error.message || 'Failed to delete price')
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Get root categories only
 */
export function useUnifiedRootCategories() {
  const { data: categories = [], isLoading, error } = useCategories()
  return {
    data: categories.filter(cat => !cat.parent_id),
    isLoading,
    error
  }
}

/**
 * Get subcategories for a specific parent
 */
export function useUnifiedSubcategories(parentId: string) {
  const { data: categories = [], isLoading, error } = useCategories()
  return {
    data: categories.filter(cat => cat.parent_id === parentId),
    isLoading,
    error
  }
}

/**
 * Get products for a specific category
 */
export function useProductsByCategory(categoryId: string) {
  const { data: products = [], isLoading, error } = useProducts({ categoryId })
  return {
    data: products.filter(prod => prod.category_id === categoryId),
    isLoading,
    error
  }
}

/**
 * Get a specific product by ID
 */
export function useUnifiedProduct(productId: string) {
  const { data: products = [], isLoading, error } = useProducts()
  return {
    data: products.find(prod => prod.id === productId),
    isLoading,
    error
  }
}

/**
 * Get category hierarchy with breadcrumbs
 */
export function useUnifiedCategoryHierarchy(categoryId?: string) {
  const { data: categories = [] } = useCategories()
  
  if (!categoryId) return []
  
  const buildPath = (catId: string, path: string[] = []): string[] => {
    const category = categories.find(c => c.id === catId)
    if (!category) return path
    
    const newPath = [category.name, ...path]
    
    if (category.parent_id) {
      return buildPath(category.parent_id, newPath)
    }
    
    return newPath
  }
  
  return buildPath(categoryId).reverse()
}

/**
 * Get all menucards
 */
export function useMenu
  return useQuery({
    queryKey: unifiedMenuKeys.menucards,
    queryFn: async () => {
      const response = await fetch('/api/menu/menucards')
      if (!response.ok) {
        throw new Error('Failed to fetch menucards')
      }
      const result = await response.json()
      return result.data || []
    }
  })
}

/**
 * Get a specific menucard by ID
 */
export function useMenu
  return useQuery({
    queryKey: unifiedMenuKeys.menucard(menucardId),
    queryFn: async () => {
      const response = await fetch(`/api/menu/menucards?id=${menucardId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch menucard')
      }
      const result = await response.json()
      return result.data?.[0] || null
    },
    enabled: !!menucardId
  })
}

/**
 * Create a new menucard
 */
export function useCreateUnifiedMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (menucardData: {
      name: string
      description?: string
      sort_index?: number
      categories?: string[]
      products?: string[]
    }) => {
      const response = await fetch('/api/menu/menucards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menucardData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create menucard')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Menucard created successfully')
    },
    onError: (error) => {
      console.error('Error creating menucard:', error)
      toast.error(error.message || 'Failed to create menucard')
    }
  })
}

/**
 * Update an existing menucard
 */
export function useUpdateUnifiedMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updateData: {
      id: string
      updates: Partial<{
        name: string
        description: string
        sort_index: number
        active: boolean
      }>
      categories?: string[]
      products?: string[]
    }) => {
      const response = await fetch('/api/menu/menucards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update menucard')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Menucard updated successfully')
    },
    onError: (error) => {
      console.error('Error updating menucard:', error)
      toast.error(error.message || 'Failed to update menucard')
    }
  })
}

/**
 * Delete a menucard
 */
export function useDeleteUnifiedMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (menucardId: string) => {
      const response = await fetch(`/api/menu/menucards?id=${menucardId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete menucard')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMenuKeys.all })
      toast.success('Menucard deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting menucard:', error)
      toast.error(error.message || 'Failed to delete menucard')
    }
  })
}

// ================================================
// REAL-TIME UPDATES
// ================================================

/**
 * Subscribe to real-time menu updates
 */
export function useMenu
  // This would integrate with Supabase real-time subscriptions
  // For now, we'll use React Query's built-in refetching
  const { data, refetch } = useMenu
  
  // Set up periodic refetching for real-time feel
  React.useEffect(() => {
    if (!menucardId) return
    
    const interval = setInterval(() => {
      refetch()
    }, 30000) // Refetch every 30 seconds
    
    return () => clearInterval(interval)
  }, [menucardId, refetch])
  
  return { data, refetch }
}
