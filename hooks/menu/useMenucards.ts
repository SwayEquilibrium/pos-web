// ================================================
// MENUCARDS HOOKS
// React Query hooks for menucard operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as menucardsRepo from '@/lib/repos/menucards.repo'
import * as reorderRepo from '@/lib/repos/reorder.repo'
import type { 
  Menucard, 
  MenucardFormData,
  Category
} from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const menucardKeys = {
  all: ['menucards'] as const,
  withCategories: ['menucards', 'with-categories'] as const,
  detail: (id: string) => ['menucards', 'detail', id] as const,
  categories: (menucardId: string) => ['menucard-categories', menucardId] as const,
  availableCategories: (menucardId: string) => ['categories', 'available', menucardId] as const
}

// ================================================
// QUERIES
// ================================================

export function useMenucards() {
  const query = useQuery({
    queryKey: menucardKeys.all,
    queryFn: menucardsRepo.getMenucards,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })

  const createMenucard = useCreateMenucard()
  const updateMenucard = useUpdateMenucard()
  const deleteMenucard = useDeleteMenucard()
  const reorderMenucards = useReorderMenucards()

  return {
    ...query,
    createMenucard,
    updateMenucard,
    deleteMenucard,
    reorderMenucards
  }
}

export function useMenucardsWithCategories() {
  return useQuery({
    queryKey: menucardKeys.withCategories,
    queryFn: menucardsRepo.getMenucardsWithCategories,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useMenucard(id?: string | null) {
  return useQuery({
    queryKey: menucardKeys.detail(id || ''),
    queryFn: () => id ? menucardsRepo.getMenucard(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useMenucardWithCategories(id?: string | null) {
  return useQuery({
    queryKey: [menucardKeys.detail(id || ''), 'with-categories'],
    queryFn: () => id ? menucardsRepo.getMenucardWithCategories(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// ================================================
// MENUCARD CATEGORIES QUERIES
// ================================================

export function useMenucardCategories(menucardId?: string | null) {
  return useQuery({
    queryKey: menucardKeys.categories(menucardId || ''),
    queryFn: () => menucardId ? menucardsRepo.getMenucardCategories(menucardId) : Promise.resolve([]),
    enabled: !!menucardId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more dynamic)
    cacheTime: 5 * 60 * 1000
  })
}

export function useAvailableCategories(menucardId?: string | null) {
  return useQuery({
    queryKey: menucardKeys.availableCategories(menucardId || ''),
    queryFn: () => menucardId ? menucardsRepo.getAvailableCategories(menucardId) : Promise.resolve([]),
    enabled: !!menucardId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  })
}

// ================================================
// MENUCARD MUTATIONS
// ================================================

export function useCreateMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menucardsRepo.createMenucard,
    onSuccess: (newMenucard) => {
      // Invalidate menucard queries
      queryClient.invalidateQueries({ queryKey: menucardKeys.all })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })

      toast.success('Menucard created successfully')
    },
    onError: (error) => {
      console.error('Error creating menucard:', error)
      toast.error('Failed to create menucard')
    }
  })
}

export function useUpdateMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MenucardFormData> }) =>
      menucardsRepo.updateMenucard(id, updates),
    onSuccess: (updatedMenucard) => {
      // Invalidate menucard queries
      queryClient.invalidateQueries({ queryKey: menucardKeys.all })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })
      
      // Update the specific menucard in cache
      queryClient.setQueryData(
        menucardKeys.detail(updatedMenucard.id),
        updatedMenucard
      )

      toast.success('Menucard updated successfully')
    },
    onError: (error) => {
      console.error('Error updating menucard:', error)
      toast.error('Failed to update menucard')
    }
  })
}

export function useDeleteMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menucardsRepo.deleteMenucard,
    onSuccess: () => {
      // Invalidate all menucard queries
      queryClient.invalidateQueries({ queryKey: menucardKeys.all })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })
      
      toast.success('Menucard deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting menucard:', error)
      toast.error('Failed to delete menucard')
    }
  })
}

// ================================================
// MENUCARD CATEGORY MUTATIONS
// ================================================

export function useAddCategoryToMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menucardId, categoryId }: { menucardId: string; categoryId: string }) =>
      menucardsRepo.addCategoryToMenucard(menucardId, categoryId),
    onSuccess: (_, { menucardId }) => {
      // Invalidate menucard category queries
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.availableCategories(menucardId) 
      })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })

      toast.success('Category added to menucard')
    },
    onError: (error) => {
      console.error('Error adding category to menucard:', error)
      toast.error('Failed to add category to menucard')
    }
  })
}

export function useRemoveCategoryFromMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menucardId, categoryId }: { menucardId: string; categoryId: string }) =>
      menucardsRepo.removeCategoryFromMenucard(menucardId, categoryId),
    onSuccess: (_, { menucardId }) => {
      // Invalidate menucard category queries
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.availableCategories(menucardId) 
      })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })

      toast.success('Category removed from menucard')
    },
    onError: (error) => {
      console.error('Error removing category from menucard:', error)
      toast.error('Failed to remove category from menucard')
    }
  })
}

// ================================================
// REORDER MUTATIONS
// ================================================

export function useReorderMenucards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderRepo.reorderMenucards,
    onMutate: async (newOrder: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: menucardKeys.all })

      // Snapshot the previous value
      const previousMenucards = queryClient.getQueryData<Menucard[]>(menucardKeys.all)

      // Optimistically update to the new value
      if (previousMenucards) {
        const reorderedMenucards = newOrder.map((id, index) => {
          const menucard = previousMenucards.find(mc => mc.id === id)
          return menucard ? { ...menucard, sort_index: index } : null
        }).filter(Boolean) as Menucard[]

        queryClient.setQueryData(menucardKeys.all, reorderedMenucards)
      }

      return { previousMenucards }
    },
    onError: (error, newOrder, context) => {
      // Rollback on error
      if (context?.previousMenucards) {
        queryClient.setQueryData(menucardKeys.all, context.previousMenucards)
      }
      console.error('Error reordering menucards:', error)
      toast.error('Failed to reorder menu cards')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: menucardKeys.all })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })
    }
  })
}

export function useReorderMenucardCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menucardId, categoryIds }: { menucardId: string; categoryIds: string[] }) =>
      reorderRepo.reorderMenucardCategories(menucardId, categoryIds),
    onMutate: async ({ menucardId, categoryIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<(Category & { sort_index: number })[]>(
        menucardKeys.categories(menucardId)
      )

      // Optimistically update to the new value
      if (previousCategories) {
        const reorderedCategories = categoryIds.map((id, index) => {
          const category = previousCategories.find(c => c.id === id)
          return category ? { ...category, sort_index: index } : null
        }).filter(Boolean) as (Category & { sort_index: number })[]

        queryClient.setQueryData(
          menucardKeys.categories(menucardId), 
          reorderedCategories
        )
      }

      return { previousCategories }
    },
    onError: (error, { menucardId }, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(
          menucardKeys.categories(menucardId),
          context.previousCategories
        )
      }
      console.error('Error reordering menucard categories:', error)
      toast.error('Failed to reorder categories')
    },
    onSettled: (_, __, { menucardId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useMoveMenucardCategory(menucardId: string) {
  const reorderMutation = useReorderMenucardCategories()
  const { data: categories = [] } = useMenucardCategories(menucardId)

  const moveUp = (categoryId: string) => {
    return reorderRepo.moveItemUp(
      categories,
      categoryId,
      (categoryIds) => reorderMutation.mutateAsync({ menucardId, categoryIds })
    )
  }

  const moveDown = (categoryId: string) => {
    return reorderRepo.moveItemDown(
      categories,
      categoryId,
      (categoryIds) => reorderMutation.mutateAsync({ menucardId, categoryIds })
    )
  }

  const moveToPosition = (categoryId: string, newPosition: number) => {
    return reorderRepo.moveItemToPosition(
      categories,
      categoryId,
      newPosition,
      (categoryIds) => reorderMutation.mutateAsync({ menucardId, categoryIds })
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
// BULK OPERATIONS
// ================================================

export function useBulkAddCategoriesToMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menucardId, categoryIds }: { menucardId: string; categoryIds: string[] }) =>
      menucardsRepo.bulkAddCategoriesToMenucard(menucardId, categoryIds),
    onSuccess: (_, { menucardId }) => {
      // Invalidate menucard category queries
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.availableCategories(menucardId) 
      })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })

      toast.success('Categories added to menucard')
    },
    onError: (error) => {
      console.error('Error bulk adding categories to menucard:', error)
      toast.error('Failed to add categories to menucard')
    }
  })
}

export function useBulkRemoveCategoriesFromMenucard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menucardId, categoryIds }: { menucardId: string; categoryIds: string[] }) =>
      menucardsRepo.bulkRemoveCategoriesFromMenucard(menucardId, categoryIds),
    onSuccess: (_, { menucardId }) => {
      // Invalidate menucard category queries
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.categories(menucardId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: menucardKeys.availableCategories(menucardId) 
      })
      queryClient.invalidateQueries({ queryKey: menucardKeys.withCategories })

      toast.success('Categories removed from menucard')
    },
    onError: (error) => {
      console.error('Error bulk removing categories from menucard:', error)
      toast.error('Failed to remove categories from menucard')
    }
  })
}
