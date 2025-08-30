// ================================================
// CATEGORIES HOOKS
// React Query hooks for category operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as menuRepo from '@/lib/repos/menu.repo'
import type { Category, CategoryFormData } from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const categoryKeys = {
  all: ['categories'] as const,
  root: ['categories', 'root'] as const,
  subcategories: (parentId: string) => ['categories', 'subcategories', parentId] as const,
  detail: (id: string) => ['categories', 'detail', id] as const
}

// ================================================
// QUERIES
// ================================================

export function useCategories() {
  const query = useQuery({
    queryKey: categoryKeys.all,
    queryFn: menuRepo.getCategories,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const reorderCategories = useReorderCategories()

  return {
    ...query,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  }
}

export function useRootCategories() {
  return useQuery({
    queryKey: categoryKeys.root,
    queryFn: menuRepo.getRootCategories,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useSubcategories(parentId?: string | null) {
  return useQuery({
    queryKey: categoryKeys.subcategories(parentId || ''),
    queryFn: () => parentId ? menuRepo.getSubcategories(parentId) : Promise.resolve([]),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

export function useCategory(id?: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id || ''),
    queryFn: () => id ? menuRepo.getCategory(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

// ================================================
// MUTATIONS
// ================================================

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.createCategory,
    onSuccess: (newCategory) => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.root })
      
      if (newCategory.parent_id) {
        queryClient.invalidateQueries({ 
          queryKey: categoryKeys.subcategories(newCategory.parent_id) 
        })
      }

      toast.success('Category created successfully')
    },
    onError: (error) => {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CategoryFormData> }) =>
      menuRepo.updateCategory(id, updates),
    onSuccess: (updatedCategory) => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.root })
      
      // Update the specific category in cache
      queryClient.setQueryData(
        categoryKeys.detail(updatedCategory.id),
        updatedCategory
      )

      if (updatedCategory.parent_id) {
        queryClient.invalidateQueries({ 
          queryKey: categoryKeys.subcategories(updatedCategory.parent_id) 
        })
      }

      toast.success('Category updated successfully')
    },
    onError: (error) => {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.deleteCategory,
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.root })
      
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  })
}

// ================================================
// REORDER MUTATIONS
// ================================================

export function useReorderCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuRepo.reorderCategories,
    onMutate: async (newOrder: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: categoryKeys.all })

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.all)

      // Optimistically update to the new value
      if (previousCategories) {
        const reorderedCategories = newOrder.map((id, index) => {
          const category = previousCategories.find(c => c.id === id)
          return category ? { ...category, sort_index: index } : null
        }).filter(Boolean) as Category[]

        queryClient.setQueryData(categoryKeys.all, reorderedCategories)
      }

      return { previousCategories }
    },
    onError: (error, newOrder, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.all, context.previousCategories)
      }
      console.error('Error reordering categories:', error)
      toast.error('Failed to reorder categories')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.root })
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useMoveCategory() {
  const reorderMutation = useReorderCategories()
  const { data: categories = [] } = useCategories()

  const moveUp = (categoryId: string) => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId)
    if (currentIndex > 0) {
      const newOrder = categories.map(cat => cat.id)
      ;[newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]]
      reorderMutation.mutate(newOrder)
    }
  }

  const moveDown = (categoryId: string) => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId)
    if (currentIndex >= 0 && currentIndex < categories.length - 1) {
      const newOrder = categories.map(cat => cat.id)
      ;[newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]]
      reorderMutation.mutate(newOrder)
    }
  }

  const moveToPosition = (categoryId: string, newPosition: number) => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId)
    if (currentIndex >= 0 && newPosition >= 0 && newPosition < categories.length) {
      const newOrder = categories.map(cat => cat.id)
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

// ================================================
// BULK OPERATIONS
// ================================================

export function useBulkDeleteCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryIds: string[]) => {
      // Delete categories one by one (could be optimized with a bulk repo function)
      for (const id of categoryIds) {
        await menuRepo.deleteCategory(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.root })
      toast.success('Categories deleted successfully')
    },
    onError: (error) => {
      console.error('Error bulk deleting categories:', error)
      toast.error('Failed to delete categories')
    }
  })
}
