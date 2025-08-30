// ================================================
// CATALOG HOOK - CONSOLIDATED CATEGORY & PRODUCT FUNCTIONS
// Re-exports from existing specialized hooks for convenience
// ================================================

import { useCategories } from './menu/useCategories'
import { useProductsByCategory } from './useUnifiedMenu'

// Re-export category functions from specialized hook
export const useRootCategories = () => {
  const { data: categories = [] } = useCategories()
  return {
    data: categories.filter(cat => !cat.parent_id),
    isLoading: false, // Already handled by useCategories
    error: null
  }
}

export const useSubcategories = (parentId?: string | null) => {
  const { data: categories = [] } = useCategories()
  return {
    data: categories.filter(cat => cat.parent_id === parentId),
    isLoading: false,
    error: null
  }
}

export const useCategoryBreadcrumbs = (categoryId: string) => {
  const { data: categories = [] } = useCategories()

  const buildBreadcrumbs = (id: string, crumbs: any[] = []): any[] => {
    const category = categories.find(cat => cat.id === id)
    if (!category) return crumbs

    crumbs.unshift({
      id: category.id,
      name: category.name,
      level: category.parent_id ? 1 : 0
    })

    if (category.parent_id) {
      return buildBreadcrumbs(category.parent_id, crumbs)
    }

    return crumbs
  }

  return {
    data: buildBreadcrumbs(categoryId),
    isLoading: false,
    error: null
  }
}

// Re-export product functions
export { useProductsByCategory }

// Re-export main category hook for completeness
export { useCategories }



