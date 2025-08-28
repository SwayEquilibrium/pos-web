import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import * as menuRepo from '@/lib/repos/menu.repo'

// ================================================
// CONSOLIDATED MENU HOOK - SINGLE SOURCE OF TRUTH
// ================================================

// Types for modifiers
export interface ProductModifier {
  modifier_id: string
  modifier_name: string
  modifier_price: number
  group_id: string
  group_name: string
  group_type: 'variant' | 'addon'
  required: boolean
  min_selections: number
  max_selections: number
}

export interface SelectedModifier {
  modifier_id: string
  modifier_name: string
  price_adjustment: number
}

// Query keys
const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  products: () => [...menuKeys.all, 'products'] as const,
  modifiers: () => [...menuKeys.all, 'modifiers'] as const,
  pricing: () => [...menuKeys.all, 'pricing'] as const,
  menucards: () => [...menuKeys.all, 'menucards'] as const,
  menu: (menucardId: string) => [...menuKeys.all, 'menu', menucardId] as const,
  category: (categoryId: string) => [...menuKeys.all, 'categories', categoryId] as const,
  product: (productId: string) => [...menuKeys.all, 'products', productId] as const,
}

// ================================================
// CATEGORIES
// ================================================

export function useCategories(options?: {
  categoryId?: string
  parentId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: () => menuRepo.getCategories(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
    suspense: true,
  })
}

export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: menuKeys.category(categoryId),
    queryFn: () => menuRepo.getCategories({ categoryId }),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    suspense: true,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.Category> }) =>
      menuRepo.updateCategory(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.category(id) })
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

// ================================================
// PRODUCTS
// ================================================

export function useProducts(options?: {
  categoryId?: string
  menucardId?: string
  includeInactive?: boolean
}) {
  return useQuery({
    queryKey: [...menuKeys.products(), options],
    queryFn: () => menuRepo.getProducts(options),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    suspense: true,
  })
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: menuKeys.product(productId),
    queryFn: () => menuRepo.getProducts().then(products => 
      products.find(p => p.id === productId)
    ),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    suspense: true,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.products() })
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.Product> }) =>
      menuRepo.updateProduct(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.product(id) })
      queryClient.invalidateQueries({ queryKey: menuKeys.products() })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.products() })
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

// ================================================
// MODIFIERS
// ================================================

export function useModifiers() {
  return useQuery({
    queryKey: menuKeys.modifiers(),
    queryFn: menuRepo.getModifiers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    suspense: true,
  })
}

export function useModifierGroups() {
  return useQuery({
    queryKey: [...menuKeys.modifiers(), 'groups'],
    queryFn: menuRepo.getModifierGroups,
    staleTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    suspense: true,
  })
}

export function useModifierGroupsWithModifiers() {
  return useQuery({
    queryKey: [...menuKeys.modifiers(), 'groups-with-modifiers'],
    queryFn: async () => {
      const groups = await menuRepo.getModifierGroups()
      const groupsWithModifiers = await Promise.all(
        groups.map(async (group) => {
          const modifiers = await menuRepo.getModifiers({ groupId: group.id })
          return { ...group, modifiers }
        })
      )
      return groupsWithModifiers
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    suspense: true,
  })
}

export function useCreateModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.modifiers() })
    },
  })
}

export function useUpdateModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.Modifier> }) =>
      menuRepo.updateModifier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.modifiers() })
    },
  })
}

export function useDeleteModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.modifiers() })
    },
  })
}

export function useCreateModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createModifierGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'groups'] })
    },
  })
}

export function useUpdateModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.ModifierGroup> }) =>
      menuRepo.updateModifierGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'groups'] })
    },
  })
}

export function useDeleteModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteModifierGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'groups'] })
    },
  })
}

export function useMoveModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, newSortIndex }: { id: string; newSortIndex: number }) =>
      menuRepo.updateModifierGroup(id, { sort_index: newSortIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'groups'] })
    },
  })
}

// ================================================
// PRICING
// ================================================

export function usePricing() {
  return useQuery({
    queryKey: menuKeys.pricing(),
    queryFn: menuRepo.getPricing,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePricing() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.pricing() })
      queryClient.invalidateQueries({ queryKey: menuKeys.products() })
    },
  })
}

export function useUpdatePricing() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.ProductPrice> }) =>
      menuRepo.updatePricing(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.pricing() })
    },
  })
}

// ================================================
// MENUCARDS
// ================================================

export function useMenucards() {
  return useQuery({
    queryKey: menuKeys.menucards(),
    queryFn: menuRepo.getMenucards,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMenu(menucardId: string) {
  return useQuery({
    queryKey: menuKeys.menu(menucardId),
    queryFn: () => menuRepo.getMenu(menucardId),
    enabled: !!menucardId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMenucard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createMenucard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menucards() })
    },
  })
}

export function useUpdateMenucard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.Menucard> }) =>
      menuRepo.updateMenucard(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menucards() })
    },
  })
}

export function useDeleteMenucard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteMenucard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menucards() })
    },
  })
}

export function useReorderMenucards() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (menucardIds: string[]) => {
      // Create updates for each menucard with new sort_index
      const updates = menucardIds.map((id, index) => ({
        id,
        sort_index: index
      }))
      return menuRepo.reorderMenucards(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menucards() })
    },
  })
}

// ================================================
// REORDERING
// ================================================

export function useReorderCategories() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })
}

export function useReorderProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ categoryId, ids }: { categoryId: string; ids: string[] }) =>
      menuRepo.reorderProducts(categoryId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.products() })
    },
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useMenuData(menucardId?: string) {
  const categories = useCategories({ menucardId })
  const products = useProducts({ menucardId })
  const modifiers = useModifiers()
  const menucards = useMenucards()
  
  return {
    categories: categories.data || [],
    products: products.data || [],
    modifiers: modifiers.data || [],
    menucards: menucards.data || [],
    isLoading: categories.isLoading || products.isLoading || modifiers.isLoading || menucards.isLoading,
    error: categories.error || products.error || modifiers.error || menucards.error,
  }
}

export function useCategoryWithProducts(categoryId: string) {
  const category = useCategory(categoryId)
  const products = useProducts({ categoryId })
  
  return {
    category: category.data?.[0],
    products: products.data || [],
    isLoading: category.isLoading || products.isLoading,
    error: category.error || products.error,
  }
}

export function useProductWithModifiers(productId: string) {
  const product = useProduct(productId)
  const modifiers = useModifiers()
  
  return {
    product: product.data,
    modifiers: modifiers.data || [],
    isLoading: product.isLoading || modifiers.isLoading,
    error: product.error || modifiers.error,
  }
}

// ================================================
// SEARCH & FILTERING
// ================================================

export function useSearchProducts(query: string, categoryId?: string) {
  const products = useProducts({ categoryId })
  
  if (!query.trim()) {
    return {
      ...products,
      data: products.data || [],
    }
  }
  
  const filteredData = products.data?.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.description?.toLowerCase().includes(query.toLowerCase())
  ) || []
  
  return {
    ...products,
    data: filteredData,
  }
}

export function useProductSearch(query: string, categoryId?: string) {
  return useSearchProducts(query, categoryId)
}

// ================================================
// PRODUCT GROUPS
// ================================================

export function useProductGroups() {
  return useQuery({
    queryKey: [...menuKeys.all, 'product-groups'],
    queryFn: menuRepo.getProductGroups,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createProductGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'product-groups'] })
    },
  })
}

export function useUpdateProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.ProductGroup> }) =>
      menuRepo.updateProductGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'product-groups'] })
    },
  })
}

export function useDeleteProductGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteProductGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'product-groups'] })
    },
  })
}

// ================================================
// TAX CODES
// ================================================

export function useTaxCodes() {
  return useQuery({
    queryKey: [...menuKeys.all, 'tax-codes'],
    queryFn: menuRepo.getTaxCodes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateTaxCode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.createTaxCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'tax-codes'] })
    },
  })
}

export function useUpdateTaxCode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<menuRepo.TaxCode> }) =>
      menuRepo.updateTaxCode(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'tax-codes'] })
    },
  })
}

export function useDeleteTaxCode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: menuRepo.deleteTaxCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.all, 'tax-codes'] })
    },
  })
}

// ================================================
// PRODUCT-MODIFIER RELATIONSHIPS
// ================================================

export function useProductModifierGroups(productId: string) {
  return useQuery({
    queryKey: [...menuKeys.modifiers(), 'product', productId],
    queryFn: () => menuRepo.getProductModifierGroups(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAttachModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, groupId, sortIndex, isRequired }: {
      productId: string
      groupId: string
      sortIndex: number
      isRequired: boolean
    }) => menuRepo.attachModifierGroupToProduct(productId, groupId, sortIndex, isRequired),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'product', productId] })
    },
  })
}

export function useDetachModifierGroup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, groupId }: { productId: string; groupId: string }) =>
      menuRepo.detachModifierGroupFromProduct(productId, groupId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'product', productId] })
    },
  })
}

export function useReorderProductModifierGroups() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, groupIds }: { productId: string; groupIds: string[] }) =>
      menuRepo.reorderProductModifierGroups(productId, groupIds),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: [...menuKeys.modifiers(), 'product', productId] })
    },
  })
}

export function useCategoryHierarchy() {
  const categories = useCategories()
  
  const buildHierarchy = (categories: menuRepo.Category[]) => {
    const categoryMap = new Map<string, menuRepo.Category & { children: any[] }>()
    const roots: (menuRepo.Category & { children: any[] })[] = []
    
    // Initialize all categories with empty children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })
    
    // Build the hierarchy
    categories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id)
        if (parent) {
          parent.children.push(categoryMap.get(category.id)!)
        }
      } else {
        roots.push(categoryMap.get(category.id)!)
      }
    })
    
    return roots
  }
  
  return {
    ...categories,
    hierarchy: categories.data ? buildHierarchy(categories.data) : [],
  }
}

// ================================================
// UTILITY FUNCTIONS FOR MODIFIERS
// ================================================

export function useProductModifiers(productId: string) {
  return useQuery({
    queryKey: [...menuKeys.modifiers(), 'product', productId],
    queryFn: () => menuRepo.getProductModifiers(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  })
}

export function groupModifiersByGroup(modifiers: ProductModifier[]) {
  const groups: Record<string, ProductModifier[]> = {}
  
  modifiers.forEach(modifier => {
    if (!groups[modifier.group_id]) {
      groups[modifier.group_id] = []
    }
    groups[modifier.group_id].push(modifier)
  })
  
  return groups
}

export function calculateItemPrice(basePrice: number, modifiers: SelectedModifier[]): number {
  const modifierTotal = modifiers.reduce((sum, modifier) => sum + modifier.price_adjustment, 0)
  return basePrice + modifierTotal
}

// ================================================
// MENU TOGGLES & STATE MANAGEMENT
// ================================================

export function useMenuToggles() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedModifierGroups, setSelectedModifierGroups] = useState<string[]>([])
  const [isModifiersActive, setIsModifiersActive] = useState(false)

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  const toggleModifierGroup = useCallback((groupId: string) => {
    setSelectedModifierGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }, [])

  const clearSelections = useCallback(() => {
    setSelectedCategories([])
    setSelectedProducts([])
    setSelectedModifierGroups([])
  }, [])

  const toggleModifiers = useCallback(() => {
    setIsModifiersActive(prev => !prev)
  }, [])

  return {
    selectedCategories,
    selectedProducts,
    selectedModifierGroups,
    isModifiersActive,
    toggleCategory,
    toggleProduct,
    toggleModifierGroup,
    clearSelections,
    toggleModifiers
  }
}
