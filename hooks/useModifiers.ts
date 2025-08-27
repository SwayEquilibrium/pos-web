'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface ModifierGroup {
  id: string
  name: string
  description?: string
  type: 'variant' | 'addon'
  is_required: boolean
  sort_index: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Modifier {
  id: string
  group_id: string
  name: string
  description?: string
  price_adjustment: number
  sort_index: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductModifierGroup {
  id: string
  product_id: string
  modifier_group_id: string
  is_required: boolean
  sort_index: number
}

export interface ProductModifier {
  group_id: string
  group_name: string
  group_type: 'variant' | 'addon'
  group_required: boolean
  modifier_id: string
  modifier_name: string
  modifier_price: number
  modifier_sort: number
}

export interface SelectedModifier {
  modifier_id: string
  modifier_name: string
  price_adjustment: number
}

// ================================================
// QUERIES
// ================================================

// Get all modifier groups
export function useModifierGroups() {
  return useQuery({
    queryKey: ['modifier-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modifier_groups')
        .select('*')
        .eq('active', true)
        .order('sort_index')
      
      if (error) {
        console.error('[modifier-groups]', error)
        return [] as ModifierGroup[]
      }
      
      return data as ModifierGroup[]
    }
  })
}

// Get modifiers for a specific group
export function useModifiersByGroup(groupId?: string) {
  return useQuery({
    queryKey: ['modifiers', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modifiers')
        .select('*')
        .eq('group_id', groupId!)
        .eq('active', true)
        .order('sort_index')
      
      if (error) {
        console.error('[modifiers]', error)
        return [] as Modifier[]
      }
      
      return data as Modifier[]
    }
  })
}

// Get available modifiers for a specific product
export function useProductModifiers(productId?: string) {
  return useQuery({
    queryKey: ['product-modifiers', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_product_modifiers', { product_uuid: productId! })
      
      if (error) {
        console.error('[product-modifiers]', error)
        return [] as ProductModifier[]
      }
      
      return data as ProductModifier[]
    }
  })
}

// ================================================
// MUTATIONS
// ================================================

// Create modifier group
export function useCreateModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      name: string
      description?: string
      type: 'variant' | 'addon'
      is_required?: boolean
      sort_index?: number
    }) => {
      const { data, error } = await supabase
        .from('modifier_groups')
        .insert({
          name: params.name,
          description: params.description,
          type: params.type,
          is_required: params.is_required || false,
          sort_index: params.sort_index || 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating modifier group:', error)
        throw new Error(`Failed to create modifier group: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })
    }
  })
}

// Create modifier
export function useCreateModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      group_id: string
      name: string
      description?: string
      price_adjustment?: number
      sort_index?: number
    }) => {
      const { data, error } = await supabase
        .from('modifiers')
        .insert({
          group_id: params.group_id,
          name: params.name,
          description: params.description,
          price_adjustment: params.price_adjustment || 0,
          sort_index: params.sort_index || 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating modifier:', error)
        throw new Error(`Failed to create modifier: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] })
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// Link product to modifier group
export function useAddProductModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      product_id: string
      modifier_group_id: string
      sort_index?: number
    }) => {
      const { data, error } = await supabase
        .from('product_modifiers')
        .insert({
          product_id: params.product_id,
          modifier_group_id: params.modifier_group_id,
          sort_index: params.sort_index || 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error linking product to modifier group:', error)
        throw new Error(`Failed to link product to modifier group: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// Update modifier group
export function useUpdateModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      description?: string
      type?: 'variant' | 'addon'
      is_required?: boolean
      sort_index?: number
      active?: boolean
    }) => {
      const { id, ...updateData } = params
      
      const { data, error } = await supabase
        .from('modifier_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating modifier group:', error)
        throw new Error(`Failed to update modifier group: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// Update modifier
export function useUpdateModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      id: string
      name?: string
      description?: string
      price_adjustment?: number
      sort_index?: number
      active?: boolean
    }) => {
      const { id, ...updateData } = params
      
      const { data, error } = await supabase
        .from('modifiers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating modifier:', error)
        throw new Error(`Failed to update modifier: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] })
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// Delete modifier group (soft delete by setting active = false)
export function useDeleteModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('modifier_groups')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error deleting modifier group:', error)
        throw new Error(`Failed to delete modifier group: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// Delete modifier (soft delete by setting active = false)
export function useDeleteModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('modifiers')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error deleting modifier:', error)
        throw new Error(`Failed to delete modifier: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] })
      queryClient.invalidateQueries({ queryKey: ['product-modifiers'] })
    }
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

// Calculate total price with modifiers
export function calculateItemPrice(basePrice: number, selectedModifiers: SelectedModifier[]): number {
  return selectedModifiers.reduce((total, modifier) => {
    return total + modifier.price_adjustment
  }, basePrice)
}

// Group modifiers by their group
export function groupModifiersByGroup(productModifiers: ProductModifier[]): Record<string, ProductModifier[]> {
  return productModifiers.reduce((groups, modifier) => {
    const groupId = modifier.group_id
    if (!groups[groupId]) {
      groups[groupId] = []
    }
    groups[groupId].push(modifier)
    return groups
  }, {} as Record<string, ProductModifier[]>)
}
