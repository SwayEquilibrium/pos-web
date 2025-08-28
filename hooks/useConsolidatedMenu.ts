import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ================================================
// CONSOLIDATED MENU HOOK - REPLACES ALL DUPLICATE HOOKS
// ================================================

// Unified query keys
export const consolidatedMenuKeys = {
  all: ['consolidated-menu'] as const,
  categories: ['consolidated-menu', 'categories'] as const,
  products: ['consolidated-menu', 'products'] as const,
  modifiers: ['consolidated-menu', 'modifiers'] as const,
  pricing: ['consolidated-menu', 'pricing'] as const,
  menucards: ['consolidated-menu', 'menucards'] as const,
  category: (id: string) => ['consolidated-menu', 'categories', id] as const,
  product: (id: string) => ['consolidated-menu', 'products', id] as const,
  menucard: (id: string) => ['consolidated-menu', 'menucards', id] as const,
  modifier: (id: string) => ['consolidated-menu', 'modifiers', id] as const
}

// ================================================
// CATEGORIES
// ================================================

export function useCategories(options?: {
  categoryId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  const { categoryId, menucardId, includeInactive } = options || {}
  
  return useQuery({
    queryKey: [...consolidatedMenuKeys.categories, categoryId, menucardId, includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'categories',
        action: 'list',
        ...(categoryId && { id: categoryId }),
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: consolidatedMenuKeys.category(categoryId),
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'categories',
        action: 'get',
        id: categoryId
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch category')
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryData: {
      name: string
      description?: string
      parent_id?: string | null
      sort_index?: number
      color?: string
      emoji?: string
      display_style?: string
      image_url?: string
      image_thumbnail_url?: string
    }) => {
      const response = await fetch('/api/menu?action=categories&create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryData,
          active: true,
          sort_index: categoryData.sort_index || 0,
          color: categoryData.color || '#3B82F6',
          emoji: categoryData.emoji || '📁',
          display_style: categoryData.display_style || 'emoji'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create category')
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.categories })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`)
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      description?: string
      parent_id?: string | null
      sort_index?: number
      color?: string
      emoji?: string
      display_style?: string
      image_url?: string
      image_thumbnail_url?: string
      active?: boolean
    }) => {
      const { id, ...updates } = params
      
      const response = await fetch(`/api/menu?action=categories&update&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update category')
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.categories })
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.category(data.id) })
      toast.success('Category updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`)
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/menu?resource=categories&id=${categoryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete category')
      }
      
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.categories })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`)
    }
  })
}

// ================================================
// PRODUCTS
// ================================================

export function useProducts(options?: {
  categoryId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  const { categoryId, menucardId, includeInactive } = options || {}
  
  return useQuery({
    queryKey: [...consolidatedMenuKeys.products, categoryId, menucardId, includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'products',
        action: 'list',
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

export function useProduct(productId: string) {
  return useQuery({
    queryKey: consolidatedMenuKeys.product(productId),
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'products',
        action: 'get',
        id: productId
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productData: {
      name: string
      category_id?: string
      product_group_id?: string
      description?: string
      dine_in_price?: number
      dine_in_tax?: string
      takeaway_price?: number
      takeaway_tax?: string
    }) => {
      const response = await fetch('/api/menu?action=products&create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create product')
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.products })
      toast.success('Product created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`)
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      category_id?: string
      product_group_id?: string
      description?: string
      active?: boolean
    }) => {
      const { id, ...updates } = params
      
      const response = await fetch(`/api/menu?action=products&update&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update product')
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.products })
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.product(data.id) })
      toast.success('Product updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`)
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/menu?resource=products&id=${productId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.products })
      toast.success('Product deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete product: ${error.message}`)
    }
  })
}

// ================================================
// MODIFIERS
// ================================================

export function useModifiers() {
  return useQuery({
    queryKey: consolidatedMenuKeys.modifiers,
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'modifiers',
        action: 'list'
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

export function useCreateModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (modifierData: {
      type: 'group' | 'modifier'
      name: string
      description?: string
      group_id?: string
      min_select?: number
      max_select?: number
      kind?: 'add' | 'remove'
      price_delta?: number
      sort_index?: number
    }) => {
      const response = await fetch('/api/menu?action=modifiers&method=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modifierData,
          active: true,
          sort_index: modifierData.sort_index || 0
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create modifier')
      }
      
      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.modifiers })
      toast.success('Modifier created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create modifier: ${error.message}`)
    }
  })
}

// ================================================
// MENUCARDS
// ================================================

export function useMenucards() {
  return useQuery({
    queryKey: consolidatedMenuKeys.menucards,
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'menucards',
        action: 'list'
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch menucards')
      }
      
      const result = await response.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

export function useMenucard(menucardId: string) {
  return useQuery({
    queryKey: consolidatedMenuKeys.menucard(menucardId),
    queryFn: async () => {
      const params = new URLSearchParams({
        resource: 'menucards',
        action: 'get',
        id: menucardId
      })
      
      const response = await fetch(`/api/menu?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch menucard')
      }
      
      const result = await response.json()
      return result.data
    },
    enabled: !!menucardId,
    staleTime: 5 * 60 * 1000
  })
}

// ================================================
// REORDERING
// ================================================

export function useReorderCategories() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      categoryIds: string[]
      parentId?: string | null
    }) => {
      const response = await fetch('/api/menu?action=categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error('Failed to reorder categories')
      }
      
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.categories })
      toast.success('Categories reordered successfully')
    },
    onError: (error) => {
      toast.error(`Failed to reorder categories: ${error.message}`)
    }
  })
}

export function useReorderProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      productIds: string[]
      categoryId: string
    }) => {
      const response = await fetch('/api/menu?action=products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error('Failed to reorder products')
      }
      
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidatedMenuKeys.products })
      toast.success('Products reordered successfully')
    },
    onError: (error) => {
      toast.error(`Failed to reorder products: ${error.message}`)
    }
  })
}

// ================================================
// COMPOSED HOOKS FOR COMPLEX OPERATIONS
// ================================================

export function useMenuEditor(menucardId?: string) {
  const categories = useCategories({ menucardId })
  const products = useProducts({ menucardId })
  const modifiers = useModifiers()
  const menucard = useMenucard(menucardId || '')
  
  return {
    categories: categories.data || [],
    products: products.data || [],
    modifiers: modifiers.data || [],
    menucard: menucard.data,
    isLoading: categories.isLoading || products.isLoading || modifiers.isLoading || menucard.isLoading,
    isError: categories.isError || products.isError || modifiers.isError || menucard.isError,
    error: categories.error || products.error || modifiers.error || menucard.error
  }
}

export function useCategoryManager(parentId?: string | null) {
  const categories = useCategories({ parentId })
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const reorderCategories = useReorderCategories()
  
  return {
    categories: categories.data || [],
    isLoading: categories.isLoading,
    isError: categories.isError,
    error: categories.error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  }
}

export function useProductManager(categoryId?: string) {
  const products = useProducts({ categoryId })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const reorderProducts = useReorderProducts()
  
  return {
    products: products.data || [],
    isLoading: products.isLoading,
    isError: products.isError,
    error: products.error,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProducts
  }
}
