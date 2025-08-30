// ================================================
// PRODUCT GROUPS HOOKS
// React Query hooks for product group operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as menuRepo from '@/lib/repos/menu.repo'
import type { ProductGroup, ProductGroupFormData } from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const productGroupKeys = {
  all: ['product-groups'] as const,
  detail: (id: string) => ['product-groups', 'detail', id] as const
}

// ================================================
// QUERIES
// ================================================

export function useProductGroups() {
  const query = useQuery({
    queryKey: productGroupKeys.all,
    queryFn: menuRepo.getProductGroups,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  const createProductGroup = useCreateProductGroup()
  const updateProductGroup = useUpdateProductGroup()
  const deleteProductGroup = useDeleteProductGroup()
  const reorderProductGroups = useReorderProductGroups()

  return {
    ...query,
    createProductGroup,
    updateProductGroup,
    deleteProductGroup,
    reorderProductGroups
  }
}

export function useProductGroup(id?: string | null) {
  return useQuery({
    queryKey: productGroupKeys.detail(id || ''),
    queryFn: () => id ? menuRepo.getProductGroup(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000
  })
}

// ================================================
// MUTATIONS
// ================================================

export function useCreateProductGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.createProductGroup,
    onSuccess: (newProductGroup) => {
      // Invalidate product group queries
      queryClient.invalidateQueries({ queryKey: productGroupKeys.all })

      toast.success('Product group created successfully')
    },
    onError: (error) => {
      console.error('Error creating product group:', error)
      toast.error('Failed to create product group')
    }
  })
}

export function useUpdateProductGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProductGroupFormData> }) =>
      menuRepo.updateProductGroup(id, updates),
    onSuccess: (updatedProductGroup) => {
      // Invalidate product group queries
      queryClient.invalidateQueries({ queryKey: productGroupKeys.all })
      
      // Update the specific product group in cache
      queryClient.setQueryData(
        productGroupKeys.detail(updatedProductGroup.id),
        updatedProductGroup
      )

      toast.success('Product group updated successfully')
    },
    onError: (error) => {
      console.error('Error updating product group:', error)
      toast.error('Failed to update product group')
    }
  })
}

export function useDeleteProductGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.deleteProductGroup,
    onSuccess: () => {
      // Invalidate all product group queries
      queryClient.invalidateQueries({ queryKey: productGroupKeys.all })
      
      toast.success('Product group deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting product group:', error)
      toast.error('Failed to delete product group')
    }
  })
}

// ================================================
// REORDER MUTATIONS
// ================================================

export function useReorderProductGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.reorderProductGroups,
    onMutate: async (newOrder: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productGroupKeys.all })

      // Snapshot the previous value
      const previousProductGroups = queryClient.getQueryData<ProductGroup[]>(productGroupKeys.all)

      // Optimistically update to the new value
      if (previousProductGroups) {
        const reorderedProductGroups = newOrder.map((id, index) => {
          const productGroup = previousProductGroups.find(pg => pg.id === id)
          return productGroup ? { ...productGroup, sort_index: index } : null
        }).filter(Boolean) as ProductGroup[]

        queryClient.setQueryData(productGroupKeys.all, reorderedProductGroups)
      }

      return { previousProductGroups }
    },
    onError: (error, newOrder, context) => {
      // Rollback on error
      if (context?.previousProductGroups) {
        queryClient.setQueryData(productGroupKeys.all, context.previousProductGroups)
      }
      console.error('Error reordering product groups:', error)
      toast.error('Failed to reorder product groups')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: productGroupKeys.all })
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useMoveProductGroup() {
  const reorderMutation = useReorderProductGroups()
  const { data: productGroups = [] } = useProductGroups()

  const moveUp = (productGroupId: string) => {
    const currentIndex = productGroups.findIndex(group => group.id === productGroupId)
    if (currentIndex > 0) {
      const newOrder = productGroups.map(group => group.id)
      ;[newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]]
      reorderMutation.mutate(newOrder)
    }
  }

  const moveDown = (productGroupId: string) => {
    const currentIndex = productGroups.findIndex(group => group.id === productGroupId)
    if (currentIndex >= 0 && currentIndex < productGroups.length - 1) {
      const newOrder = productGroups.map(group => group.id)
      ;[newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]]
      reorderMutation.mutate(newOrder)
    }
  }

  const moveToPosition = (productGroupId: string, newPosition: number) => {
    const currentIndex = productGroups.findIndex(group => group.id === productGroupId)
    if (currentIndex >= 0 && newPosition >= 0 && newPosition < productGroups.length) {
      const newOrder = productGroups.map(group => group.id)
      const [item] = newOrder.splice(currentIndex, 1)
      newOrder.splice(newPosition, 0, item)
      reorderMutation.mutate(newOrder)
    }
  }

  return {
    moveUp,
    moveDown,
    moveToPosition,
    isLoading: reorderMutation.isPending
  }
}

/**
 * Get product groups formatted for select dropdowns
 */
export function useProductGroupOptions() {
  const { data: productGroups = [], isLoading, error } = useProductGroups()

  const options = productGroups.map(productGroup => ({
    value: productGroup.id,
    label: productGroup.name,
    description: productGroup.description
  }))

  return {
    options,
    isLoading,
    error
  }
}

// ================================================
// BULK OPERATIONS
// ================================================

export function useBulkDeleteProductGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productGroupIds: string[]) => {
      // Delete product groups one by one (could be optimized with a bulk repo function)
      for (const id of productGroupIds) {
        await menuRepo.deleteProductGroup(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productGroupKeys.all })
      toast.success('Product groups deleted successfully')
    },
    onError: (error) => {
      console.error('Error bulk deleting product groups:', error)
      toast.error('Failed to delete product groups')
    }
  })
}
