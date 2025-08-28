// ================================================
// PRODUCT GROUPS HOOKS
// React Query hooks for product group operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as catalogRepo from '/lib/repos/menu.repo'
import * as reorderRepo from '@/lib/repos/reorder.repo'
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
    queryFn: catalogRepo.getProductGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
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
    queryFn: () => id ? catalogRepo.getProductGroup(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// ================================================
// MUTATIONS
// ================================================

export function useCreateProductGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: catalogRepo.createProductGroup,
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
      catalogRepo.updateProductGroup(id, updates),
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
    mutationFn: catalogRepo.deleteProductGroup,
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
    mutationFn: reorderRepo.reorderProductGroups,
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
    return reorderRepo.moveItemUp(
      productGroups,
      productGroupId,
      reorderMutation.mutateAsync
    )
  }

  const moveDown = (productGroupId: string) => {
    return reorderRepo.moveItemDown(
      productGroups,
      productGroupId,
      reorderMutation.mutateAsync
    )
  }

  const moveToPosition = (productGroupId: string, newPosition: number) => {
    return reorderRepo.moveItemToPosition(
      productGroups,
      productGroupId,
      newPosition,
      reorderMutation.mutateAsync
    )
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
        await catalogRepo.deleteProductGroup(id)
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
