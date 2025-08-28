'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { useMenuData, useCategoryHierarchy } from '@/hooks/useMenu'

// ================================================
// MENU CONTEXT - MENU DATA MANAGEMENT
// ================================================

interface MenuContextType {
  // Data
  categories: any[]
  products: any[]
  modifiers: any[]
  menucards: any[]
  hierarchy: any[]
  
  // State
  selectedMenucardId: string | null
  selectedCategoryId: string | null
  selectedProductId: string | null
  
  // Loading & Error states
  isLoading: boolean
  error: any
  
  // Actions
  selectMenucard: (menucardId: string) => void
  selectCategory: (categoryId: string) => void
  selectProduct: (productId: string) => void
  clearSelection: () => void
  
  // Computed values
  selectedMenucard: any
  selectedCategory: any
  selectedProduct: any
  productsInCategory: any[]
  categoryPath: any[]
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

// ================================================
// PROVIDER COMPONENT
// ================================================

interface MenuProviderProps {
  children: ReactNode
  initialMenucardId?: string
}

export function MenuProvider({ children, initialMenucardId }: MenuProviderProps) {
  const [selectedMenucardId, setSelectedMenucardId] = useState<string | null>(initialMenucardId || null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  
  // Fetch menu data
  const { categories, products, modifiers, menucards, isLoading, error } = useMenuData(selectedMenucardId || undefined)
  const { hierarchy } = useCategoryHierarchy()
  
  // Computed values
  const selectedMenucard = menucards.find(m => m.id === selectedMenucardId) || null
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || null
  const selectedProduct = products.find(p => p.id === selectedProductId) || null
  
  const productsInCategory = selectedCategoryId 
    ? products.filter(p => p.category_id === selectedCategoryId)
    : []
  
  const categoryPath = useCallback((categoryId: string): any[] => {
    const path: any[] = []
    let current = categories.find(c => c.id === categoryId)
    
    while (current) {
      path.unshift(current)
      if (current.parent_id) {
        current = categories.find(c => c.id === current.parent_id)
      } else {
        break
      }
    }
    
    return path
  }, [categories])
  
  // Actions
  const selectMenucard = useCallback((menucardId: string) => {
    setSelectedMenucardId(menucardId)
    setSelectedCategoryId(null)
    setSelectedProductId(null)
  }, [])
  
  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedProductId(null)
  }, [])
  
  const selectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
  }, [])
  
  const clearSelection = useCallback(() => {
    setSelectedCategoryId(null)
    setSelectedProductId(null)
  }, [])
  
  const value: MenuContextType = {
    // Data
    categories,
    products,
    modifiers,
    menucards,
    hierarchy,
    
    // State
    selectedMenucardId,
    selectedCategoryId,
    selectedProductId,
    
    // Loading & Error states
    isLoading,
    error,
    
    // Actions
    selectMenucard,
    selectCategory,
    selectProduct,
    clearSelection,
    
    // Computed values
    selectedMenucard,
    selectedCategory,
    selectedProduct,
    productsInCategory,
    categoryPath: selectedCategoryId ? categoryPath(selectedCategoryId) : [],
  }
  
  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  )
}

// ================================================
// HOOK
// ================================================

export function useMenuContext(): MenuContextType {
  const context = useContext(MenuContext)
  
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider')
  }
  
  return context
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useSelectedMenucard() {
  const { selectedMenucard, selectedMenucardId, selectMenucard } = useMenuContext()
  return { menucard: selectedMenucard, menucardId: selectedMenucardId, selectMenucard }
}

export function useSelectedCategory() {
  const { selectedCategory, selectedCategoryId, selectCategory, productsInCategory, categoryPath } = useMenuContext()
  return { 
    category: selectedCategory, 
    categoryId: selectedCategoryId, 
    selectCategory, 
    products: productsInCategory,
    path: categoryPath
  }
}

export function useSelectedProduct() {
  const { selectedProduct, selectedProductId, selectProduct } = useMenuContext()
  return { product: selectedProduct, productId: selectedProductId, selectProduct }
}

export function useMenuNavigation() {
  const { 
    categories, 
    hierarchy, 
    selectCategory, 
    selectMenucard, 
    selectedMenucardId,
    selectedCategoryId 
  } = useMenuContext()
  
  const navigateToCategory = useCallback((categoryId: string) => {
    selectCategory(categoryId)
  }, [selectCategory])
  
  const navigateToMenucard = useCallback((menucardId: string) => {
    selectMenucard(menucardId)
  }, [selectMenucard])
  
  const getBreadcrumbs = useCallback(() => {
    if (!selectedCategoryId) return []
    
    const breadcrumbs: any[] = []
    let current = categories.find(c => c.id === selectedCategoryId)
    
    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        type: 'category' as const
      })
      
      if (current.parent_id) {
        current = categories.find(c => c.id === current.parent_id)
      } else {
        break
      }
    }
    
    return breadcrumbs
  }, [categories, selectedCategoryId])
  
  return {
    categories,
    hierarchy,
    navigateToCategory,
    navigateToMenucard,
    getBreadcrumbs,
    selectedMenucardId,
    selectedCategoryId,
  }
}

export function useMenuSearch() {
  const { products, categories } = useMenuContext()
  
  const searchProducts = useCallback((query: string, categoryId?: string) => {
    if (!query.trim()) return []
    
    const searchTerm = query.toLowerCase()
    let filteredProducts = products
    
    // Filter by category if specified
    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => p.category_id === categoryId)
    }
    
    // Search in product name and description
    return filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    )
  }, [products])
  
  const searchCategories = useCallback((query: string) => {
    if (!query.trim()) return []
    
    const searchTerm = query.toLowerCase()
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm) ||
      category.description?.toLowerCase().includes(searchTerm)
    )
  }, [categories])
  
  return {
    searchProducts,
    searchCategories,
  }
}
