'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: {
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
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          description: category.description,
          parent_id: category.parent_id || null,
          sort_index: category.sort_index || 0,
          color: category.color || '#3B82F6',
          emoji: category.emoji || '📁',
          display_style: category.display_style || 'emoji',
          image_url: category.image_url,
          image_thumbnail_url: category.image_thumbnail_url,
          active: true
        }])
        .select()
        .single()

      if (error) {
        console.error('[create-category]', error)
        throw new Error(`Failed to create category: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    }
  })
}

// Update category
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
      
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[update-category]', error)
        throw new Error(`Failed to update category: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
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
        console.error('[delete-category]', error)
        throw new Error(`Failed to delete category: ${error.message}`)
      }

      return categoryId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: {
      name: string
      description?: string
      price: number
      category_id: string
      is_open_price?: boolean
      options_schema?: any
      color?: string
      emoji?: string
      display_style?: string
      image_url?: string
      image_thumbnail_url?: string
      sort_index?: number
    }) => {
      // Start with only the columns that exist in the database
      const productData: any = {
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        is_open_price: product.is_open_price || false,
        active: true
      }

      // Add optional fields only if they exist in the database
      if (product.description !== undefined) {
        productData.description = product.description || ''
      }
      
      if (product.emoji) {
        productData.emoji = product.emoji
      }
      
      if (product.color) {
        productData.color = product.color
      }
      
      if (product.display_style) {
        productData.display_style = product.display_style
      }
      
      if (product.image_url) {
        productData.image_url = product.image_url
      }

      console.log('[create-product] Starting with minimal data:', productData)

      console.log('[create-product] Attempting to insert:', productData)
      
      // First, let's test if we can even access the products table
      try {
        console.log('[create-product] Testing table access...')
        const testQuery = await supabase
          .from('products')
          .select('id,name,price,category_id,active')
          .limit(1)
        
        console.log('[create-product] Test query result:', testQuery)
        
        if (testQuery.error) {
          console.error('[create-product] Cannot read from products table:', testQuery.error)
          throw new Error(`Cannot access products table: ${testQuery.error.message}`)
        }
        
        if (testQuery.data && testQuery.data.length > 0) {
          console.log('[create-product] Available columns in first row:', Object.keys(testQuery.data[0]))
        } else {
          console.log('[create-product] Products table exists but is empty')
        }
      } catch (tableError) {
        console.error('[create-product] Table access error:', tableError)
        throw new Error(`Database table access failed: ${tableError}`)
      }
      
      let result
      try {
        console.log('[create-product] Attempting insert with data:', productData)
        result = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()
        
        console.log('[create-product] Insert completed, result:', result)
      } catch (insertError) {
        console.error('[create-product] Insert operation failed:', insertError)
        throw new Error(`Insert operation failed: ${insertError.message || insertError}`)
      }
      
      const { data, error } = result

      if (error) {
        console.error('[create-product] Full error:', error)
        console.error('[create-product] Error type:', typeof error)
        console.error('[create-product] Error keys:', Object.keys(error))
        console.error('[create-product] Error message:', error.message)
        console.error('[create-product] Error details:', error.details)
        console.error('[create-product] Error hint:', error.hint)
        console.error('[create-product] Error code:', error.code)
        console.error('[create-product] Product data:', productData)
        
        // Provide more specific error messages
        if (error.message?.includes('description')) {
          throw new Error('Database missing description column. Please run the SQL script first.')
        }
        
        if (error.code) {
          throw new Error(`Database error (${error.code}): ${error.message || error.details || 'Unknown error'}`)
        }
        
        throw new Error(`Failed to create product: ${error.message || error.details || 'Unknown database error'}`)
      }

      if (!data) {
        console.error('[create-product] No data returned but no error')
        throw new Error('Product creation failed: No data returned from database')
      }

      return data
    },
    onSuccess: (data) => {
      console.log('[create-product] Success! Created product:', data)
      // Invalidate all product-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Also invalidate the specific category query
      if (data.category_id) {
        queryClient.invalidateQueries({ queryKey: ['products', data.category_id] })
      }
      console.log('[create-product] Cache invalidated - UI should refresh')
    }
  })
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      description?: string
      price?: number
      category_id?: string
      is_open_price?: boolean
      options_schema?: any
      color?: string
      emoji?: string
      display_style?: string
      image_url?: string
      image_thumbnail_url?: string
      sort_index?: number
      active?: boolean
    }) => {
      const { id, ...updates } = params
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[update-product]', error)
        throw new Error(`Failed to update product: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
        console.error('[delete-product]', error)
        throw new Error(`Failed to delete product: ${error.message}`)
      }

      return productId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Copy product
export function useCopyProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      // First, get the original product
      const { data: originalProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) {
        console.error('[copy-product] Error fetching original product:', fetchError)
        throw new Error(`Failed to fetch original product: ${fetchError.message}`)
      }

      if (!originalProduct) {
        throw new Error('Original product not found')
      }

      // Create a copy with modified name
      const copyData = {
        ...originalProduct,
        id: undefined, // Remove ID to create new record
        name: `${originalProduct.name} (Kopi)`,
        created_at: undefined, // Remove timestamps
        updated_at: undefined
      }

      const { data: copiedProduct, error: insertError } = await supabase
        .from('products')
        .insert([copyData])
        .select()
        .single()

      if (insertError) {
        console.error('[copy-product] Error creating copy:', insertError)
        throw new Error(`Failed to copy product: ${insertError.message}`)
      }

      return copiedProduct
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}