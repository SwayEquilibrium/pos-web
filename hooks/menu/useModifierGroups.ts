// ================================================
// MODIFIER GROUPS HOOKS
// React Query hooks for modifier group operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as modifiersRepo from '@/lib/repos/modifiers.repo'
import * as reorderRepo from '@/lib/repos/reorder.repo'
import type {
  ModifierGroup,
  ModifierGroupWithModifiers,
  ModifierGroupFormData,
  ModifierFormData,
  ProductModifierGroup
} from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const modifierGroupKeys = {
  all: ['modifier-groups'] as const,
  withModifiers: ['modifier-groups', 'with-modifiers'] as const,
  detail: (id: string) => ['modifier-groups', 'detail', id] as const,
  modifiers: (groupId: string) => ['modifiers', 'by-group', groupId] as const,
  productGroups: (productId: string) => ['product-modifier-groups', productId] as const,
  availableGroups: (productId: string) => ['modifier-groups', 'available', productId] as const
}

// ================================================
// QUERIES
// ================================================

export function useModifierGroups() {
  return useQuery({
    queryKey: modifierGroupKeys.all,
    queryFn: modifiersRepo.getModifierGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useModifierGroupsWithModifiers() {
  return useQuery({
    queryKey: modifierGroupKeys.withModifiers,
    queryFn: modifiersRepo.getModifierGroupsWithModifiers,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useModifierGroup(id?: string | null) {
  return useQuery({
    queryKey: modifierGroupKeys.detail(id || ''),
    queryFn: () => id ? modifiersRepo.getModifierGroup(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useModifiersByGroup(groupId?: string | null) {
  return useQuery({
    queryKey: modifierGroupKeys.modifiers(groupId || ''),
    queryFn: () => groupId ? modifiersRepo.getModifiersByGroup(groupId) : Promise.resolve([]),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// ================================================
// PRODUCT MODIFIER GROUPS QUERIES
// ================================================

export function useProductModifierGroups(productId?: string | null) {
  return useQuery({
    queryKey: modifierGroupKeys.productGroups(productId || ''),
    queryFn: () => productId ? modifiersRepo.getProductModifierGroups(productId) : Promise.resolve([]),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more dynamic)
    cacheTime: 5 * 60 * 1000
  })
}

export function useAvailableModifierGroups(productId?: string | null) {
  return useQuery({
    queryKey: modifierGroupKeys.availableGroups(productId || ''),
    queryFn: () => productId ? modifiersRepo.getAvailableModifierGroups(productId) : Promise.resolve([]),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  })
}

// ================================================
// MODIFIER GROUP MUTATIONS
// ================================================

export function useCreateModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modifiersRepo.createModifierGroup,
    onSuccess: (newGroup) => {
      // Invalidate modifier group queries
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all })
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })

      toast.success('Modifier group created successfully')
    },
    onError: (error) => {
      console.error('Error creating modifier group:', error)
      toast.error('Failed to create modifier group')
    }
  })
}

export function useUpdateModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ModifierGroupFormData> }) =>
      modifiersRepo.updateModifierGroup(id, updates),
    onSuccess: (updatedGroup) => {
      // Invalidate modifier group queries
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all })
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })
      
      // Update the specific group in cache
      queryClient.setQueryData(
        modifierGroupKeys.detail(updatedGroup.id),
        updatedGroup
      )

      toast.success('Modifier group updated successfully')
    },
    onError: (error) => {
      console.error('Error updating modifier group:', error)
      toast.error('Failed to update modifier group')
    }
  })
}

export function useDeleteModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modifiersRepo.deleteModifierGroup,
    onSuccess: () => {
      // Invalidate all modifier group queries
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all })
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })
      
      toast.success('Modifier group deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting modifier group:', error)
      toast.error('Failed to delete modifier group')
    }
  })
}

// ================================================
// MODIFIER MUTATIONS
// ================================================

export function useCreateModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modifiersRepo.createModifier,
    onSuccess: (newModifier) => {
      // Invalidate modifier queries for the group
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.modifiers(newModifier.group_id) 
      })
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })

      toast.success('Modifier created successfully')
    },
    onError: (error) => {
      console.error('Error creating modifier:', error)
      toast.error('Failed to create modifier')
    }
  })
}

export function useUpdateModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ModifierFormData> }) =>
      modifiersRepo.updateModifier(id, updates),
    onSuccess: (updatedModifier) => {
      // Invalidate modifier queries for the group
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.modifiers(updatedModifier.group_id) 
      })
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })

      toast.success('Modifier updated successfully')
    },
    onError: (error) => {
      console.error('Error updating modifier:', error)
      toast.error('Failed to update modifier')
    }
  })
}

export function useDeleteModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: modifiersRepo.deleteModifier,
    onSuccess: () => {
      // Invalidate all modifier queries
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.withModifiers })
      
      toast.success('Modifier deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting modifier:', error)
      toast.error('Failed to delete modifier')
    }
  })
}

// ================================================
// PRODUCT MODIFIER GROUP MUTATIONS
// ================================================

export function useAttachGroupToProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupId, isRequired }: { 
      productId: string; 
      groupId: string; 
      isRequired?: boolean 
    }) => modifiersRepo.attachGroupToProduct(productId, groupId, isRequired),
    onSuccess: (_, { productId }) => {
      // Invalidate product modifier group queries
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.productGroups(productId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.availableGroups(productId) 
      })

      toast.success('Modifier group attached to product')
    },
    onError: (error) => {
      console.error('Error attaching group to product:', error)
      toast.error('Failed to attach modifier group')
    }
  })
}

export function useDetachGroupFromProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupId }: { productId: string; groupId: string }) =>
      modifiersRepo.detachGroupFromProduct(productId, groupId),
    onSuccess: (_, { productId }) => {
      // Invalidate product modifier group queries
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.productGroups(productId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.availableGroups(productId) 
      })

      toast.success('Modifier group detached from product')
    },
    onError: (error) => {
      console.error('Error detaching group from product:', error)
      toast.error('Failed to detach modifier group')
    }
  })
}

export function useUpdateProductModifierGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupId, updates }: { 
      productId: string; 
      groupId: string; 
      updates: { is_required?: boolean; sort_index?: number }
    }) => modifiersRepo.updateProductModifierGroup(productId, groupId, updates),
    onSuccess: (_, { productId }) => {
      // Invalidate product modifier group queries
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.productGroups(productId) 
      })

      toast.success('Modifier group settings updated')
    },
    onError: (error) => {
      console.error('Error updating product modifier group:', error)
      toast.error('Failed to update modifier group settings')
    }
  })
}

// ================================================
// REORDER MUTATIONS
// ================================================

export function useReorderProductModifierGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupIds }: { productId: string; groupIds: string[] }) =>
      reorderRepo.reorderProductModifierGroups(productId, groupIds),
    onMutate: async ({ productId, groupIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: modifierGroupKeys.productGroups(productId) 
      })

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData<(ModifierGroup & { is_required: boolean; sort_index: number })[]>(
        modifierGroupKeys.productGroups(productId)
      )

      // Optimistically update to the new value
      if (previousGroups) {
        const reorderedGroups = groupIds.map((id, index) => {
          const group = previousGroups.find(g => g.id === id)
          return group ? { ...group, sort_index: index } : null
        }).filter(Boolean) as (ModifierGroup & { is_required: boolean; sort_index: number })[]

        queryClient.setQueryData(
          modifierGroupKeys.productGroups(productId), 
          reorderedGroups
        )
      }

      return { previousGroups }
    },
    onError: (error, { productId }, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(
          modifierGroupKeys.productGroups(productId),
          context.previousGroups
        )
      }
      console.error('Error reordering product modifier groups:', error)
      toast.error('Failed to reorder modifier groups')
    },
    onSettled: (_, __, { productId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: modifierGroupKeys.productGroups(productId) 
      })
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useMoveProductModifierGroup(productId: string) {
  const reorderMutation = useReorderProductModifierGroups()
  const { data: groups = [] } = useProductModifierGroups(productId)

  const moveUp = (groupId: string) => {
    return reorderRepo.moveItemUp(
      groups,
      groupId,
      (groupIds) => reorderMutation.mutateAsync({ productId, groupIds })
    )
  }

  const moveDown = (groupId: string) => {
    return reorderRepo.moveItemDown(
      groups,
      groupId,
      (groupIds) => reorderMutation.mutateAsync({ productId, groupIds })
    )
  }

  const moveToPosition = (groupId: string, newPosition: number) => {
    return reorderRepo.moveItemToPosition(
      groups,
      groupId,
      newPosition,
      (groupIds) => reorderMutation.mutateAsync({ productId, groupIds })
    )
  }

  return {
    moveUp,
    moveDown,
    moveToPosition,
    isLoading: reorderMutation.isPending
  }
}

// ================================================
// MODIFIER GROUP REORDER MUTATIONS
// ================================================

export function useReorderModifierGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderRepo.reorderModifierGroups,
    onMutate: async (newOrder: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: modifierGroupKeys.all })

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData<ModifierGroup[]>(
        modifierGroupKeys.all
      )

      // Optimistically update to the new value
      if (previousGroups) {
        const reorderedGroups = newOrder.map((id, index) => {
          const group = previousGroups.find(g => g.id === id)
          return group ? { ...group, sort_index: index } : null
        }).filter(Boolean) as ModifierGroup[]

        queryClient.setQueryData(modifierGroupKeys.all, reorderedGroups)
      }

      return { previousGroups }
    },
    onError: (error, newOrder, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(
          modifierGroupKeys.all,
          context.previousGroups
        )
      }
      console.error('Error reordering modifier groups:', error)
      toast.error('Failed to reorder modifier groups')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all })
    }
  })
}

export function useMoveModifierGroup() {
  const reorderMutation = useReorderModifierGroups()
  const { data: groups = [] } = useModifierGroups()

  const moveUp = (groupId: string) => {
    return reorderRepo.moveItemUp(
      groups,
      groupId,
      (groupIds) => reorderMutation.mutateAsync(groupIds)
    )
  }

  const moveDown = (groupId: string) => {
    return reorderRepo.moveItemDown(
      groups,
      groupId,
      (groupIds) => reorderMutation.mutateAsync(groupIds)
    )
  }

  const moveToPosition = (groupId: string, newPosition: number) => {
    return reorderRepo.moveItemToPosition(
      groups,
      groupId,
      newPosition,
      (groupIds) => reorderMutation.mutateAsync(groupIds)
    )
  }

  return {
    moveUp,
    moveDown,
    moveToPosition,
    isLoading: reorderMutation.isPending
  }
}