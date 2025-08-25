'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface CreateCategoryParams {
  name: string
  parent_id?: string | null
  description?: string
  sort_index?: number
  color?: string
  emoji?: string
  display_style?: 'emoji' | 'color' | 'image'
  image_url?: string
  image_thumbnail_url?: string
}

export interface CreateProductParams {
  name: string
  category_id: string
  price: number
  description?: string
  is_open_price?: boolean
  active?: boolean
  sort_index?: number
  color?: string
  emoji?: string
  display_style?: 'emoji' | 'color' | 'image'
  image_url?: string
  image_thumbnail_url?: string
}

export interface CopyProductParams {
  source_product_id: string
  new_name: string
  new_category_id: string
  new_price?: number
}

// Create new category
export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateCategoryParams) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: params.name,
          parent_id: params.parent_id || null,
          sort_index: params.sort_index || 0,
          print_sort_index: params.sort_index || 0,
          color: params.color || '#3B82F6',
          emoji: params.emoji || '📁',
          display_style: params.display_style || 'emoji',
          image_url: params.image_url,
          image_thumbnail_url: params.image_thumbnail_url
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating category:', error)
        throw new Error(`Failed to create category: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
    }
  })
}

// Create new product
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateProductParams) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: params.name,
          category_id: params.category_id,
          price: params.price,
          is_open_price: params.is_open_price || false,
          active: params.active !== false,
          options_schema: '{}',
          color: params.color || '#10B981',
          emoji: params.emoji || '🍽️',
          display_style: params.display_style || 'emoji',
          image_url: params.image_url,
          image_thumbnail_url: params.image_thumbnail_url
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating product:', error)
        throw new Error(`Failed to create product: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate product queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}

// Copy existing product
export function useCopyProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CopyProductParams) => {
      // First get the source product
      const { data: sourceProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.source_product_id)
        .single()
      
      if (fetchError || !sourceProduct) {
        throw new Error('Source product not found')
      }
      
      // Create new product with copied data
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: params.new_name,
          category_id: params.new_category_id,
          price: params.new_price || sourceProduct.price,
          is_open_price: sourceProduct.is_open_price,
          options_schema: sourceProduct.options_schema,
          active: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error copying product:', error)
        throw new Error(`Failed to copy product: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<CreateCategoryParams>) => {
      const { id, ...updateData } = params
      
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating category:', error)
        throw new Error(`Failed to update category: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<CreateProductParams>) => {
      const { id, ...updateData } = params
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating product:', error)
        throw new Error(`Failed to update product: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) {
        console.error('Error deleting category:', error)
        throw new Error(`Failed to delete category: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) {
        console.error('Error deleting product:', error)
        throw new Error(`Failed to delete product: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}
