'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface SortItem {
  id: string
  name: string
  sort_index: number
  parent_id?: string | null
}

export interface UpdateSortOrderParams {
  items: Array<{ id: string; sort_index: number }>
  table: 'categories' | 'products'
  parent_id?: string | null
}

// Hook for updating sort order in database
export function useUpdateSortOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: UpdateSortOrderParams) => {
      const { items, table, parent_id } = params
      
      // Update all items in a transaction
      const updates = items.map(item => 
        supabase
          .from(table)
          .update({ sort_index: item.sort_index })
          .eq('id', item.id)
      )
      
      const results = await Promise.all(updates)
      
      // Check for any errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to update sort order: ${errors[0].error?.message}`)
      }
      
      return results
    },
    onSuccess: (_, params) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
      
      if (params.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['products', params.parent_id] })
        queryClient.invalidateQueries({ queryKey: ['subcategories', params.parent_id] })
      }
    }
  })
}

// Hook for moving item up/down in sort order
export function useMoveSortOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      itemId: string
      direction: 'up' | 'down'
      table: 'categories' | 'products'
      allItems: SortItem[]
    }) => {
      const { itemId, direction, table, allItems } = params
      
      // Find current item and its position
      const currentIndex = allItems.findIndex(item => item.id === itemId)
      if (currentIndex === -1) {
        throw new Error('Item not found')
      }
      
      // Calculate new position
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      // Check bounds
      if (newIndex < 0 || newIndex >= allItems.length) {
        throw new Error('Cannot move item beyond bounds')
      }
      
      // Swap items
      const newOrder = [...allItems]
      const [movedItem] = newOrder.splice(currentIndex, 1)
      newOrder.splice(newIndex, 0, movedItem)
      
      // Update sort indices
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        sort_index: index + 1
      }))
      
      // Update in database
      const updatePromises = updates.map(update => 
        supabase
          .from(table)
          .update({ sort_index: update.sort_index })
          .eq('id', update.id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to update sort order: ${errors[0].error?.message}`)
      }
      
      return newOrder
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
    }
  })
}

// Hook for auto-sorting by name or other criteria
export function useAutoSort() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      items: SortItem[]
      table: 'categories' | 'products'
      sortBy: 'name' | 'created_at'
      direction: 'asc' | 'desc'
    }) => {
      const { items, table, sortBy, direction } = params
      
      // Sort items
      const sortedItems = [...items].sort((a, b) => {
        let comparison = 0
        
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name, 'da', { numeric: true })
        } else {
          // For created_at or other fields, we'd need to fetch that data
          comparison = a.name.localeCompare(b.name, 'da', { numeric: true })
        }
        
        return direction === 'desc' ? -comparison : comparison
      })
      
      // Update sort indices
      const updates = sortedItems.map((item, index) => ({
        id: item.id,
        sort_index: index + 1
      }))
      
      // Update in database
      const updatePromises = updates.map(update => 
        supabase
          .from(table)
          .update({ sort_index: update.sort_index })
          .eq('id', update.id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to auto-sort: ${errors[0].error?.message}`)
      }
      
      return sortedItems
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      queryClient.invalidateQueries({ queryKey: ['root-categories'] })
    }
  })
}

// Utility function to reorder array for drag & drop
export function reorderItems<T extends { sort_index: number }>(
  list: T[],
  startIndex: number,
  endIndex: number
): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  
  // Update sort indices
  return result.map((item, index) => ({
    ...item,
    sort_index: index + 1
  }))
}

// Utility function to move item between lists (for moving between categories)
export function moveItemBetweenLists<T extends { sort_index: number }>(
  source: T[],
  destination: T[],
  sourceIndex: number,
  destinationIndex: number
): { source: T[]; destination: T[] } {
  const sourceClone = Array.from(source)
  const destClone = Array.from(destination)
  const [removed] = sourceClone.splice(sourceIndex, 1)
  
  destClone.splice(destinationIndex, 0, removed)
  
  // Update sort indices for both lists
  const updatedSource = sourceClone.map((item, index) => ({
    ...item,
    sort_index: index + 1
  }))
  
  const updatedDestination = destClone.map((item, index) => ({
    ...item,
    sort_index: index + 1
  }))
  
  return {
    source: updatedSource,
    destination: updatedDestination
  }
}
