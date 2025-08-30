// ================================================
// MENU TOGGLES HOOK
// Manages the top toggle state for the menu editor
// ================================================

import { useState, useCallback } from 'react'
import type { MenuToggleTab, MenuEditorState } from '@/lib/types/menu'

interface UseMenuTogglesReturn {
  activeTab: MenuToggleTab
  selectedProduct: string | null
  selectedCategory: string | null
  selectedMenucard: string | null
  selectedModifierGroup: string | null
  selectedProductGroup: string | null
  setActiveTab: (tab: MenuToggleTab) => void
  setSelectedProduct: (productId: string | null) => void
  setSelectedCategory: (categoryId: string | null) => void
  setSelectedMenucard: (menucardId: string | null) => void
  setSelectedModifierGroup: (modifierGroupId: string | null) => void
  setSelectedProductGroup: (productGroupId: string | null) => void
  clearSelections: () => void
  isProductsActive: boolean
  isCategoriesActive: boolean
  isMenucardsActive: boolean
  isModifiersActive: boolean
  isProductGroupsActive: boolean
}

const initialState: MenuEditorState = {
  activeTab: 'products',
  selectedProduct: null,
  selectedCategory: null,
  selectedMenucard: null,
  selectedModifierGroup: null,
  selectedProductGroup: null
}

export function useMenuToggles(): UseMenuTogglesReturn {
  const [state, setState] = useState<MenuEditorState>(initialState)

  const setActiveTab = useCallback((tab: MenuToggleTab) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      // Clear selections when switching tabs
      selectedProduct: null,
      selectedCategory: null,
      selectedMenucard: null,
      selectedModifierGroup: null,
      selectedProductGroup: null
    }))
  }, [])

  const setSelectedProduct = useCallback((productId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedProduct: productId,
      activeTab: 'products' // Auto-switch to products tab
    }))
  }, [])

  const setSelectedCategory = useCallback((categoryId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCategory: categoryId
    }))
  }, [])

  const setSelectedMenucard = useCallback((menucardId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedMenucard: menucardId
    }))
  }, [])

  const setSelectedModifierGroup = useCallback((modifierGroupId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedModifierGroup: modifierGroupId
    }))
  }, [])

  const setSelectedProductGroup = useCallback((productGroupId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedProductGroup: productGroupId
    }))
  }, [])

  const clearSelections = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedProduct: null,
      selectedCategory: null,
      selectedMenucard: null,
      selectedModifierGroup: null,
      selectedProductGroup: null
    }))
  }, [])

  return {
    activeTab: state.activeTab,
    selectedProduct: state.selectedProduct || null,
    selectedCategory: state.selectedCategory || null,
    selectedMenucard: state.selectedMenucard || null,
    selectedModifierGroup: state.selectedModifierGroup || null,
    selectedProductGroup: state.selectedProductGroup || null,
    setActiveTab,
    setSelectedProduct,
    setSelectedCategory,
    setSelectedMenucard,
    setSelectedModifierGroup,
    setSelectedProductGroup,
    clearSelections,
    isProductsActive: state.activeTab === 'products',
    isCategoriesActive: state.activeTab === 'categories',
    isMenucardsActive: state.activeTab === 'menucards',
    isModifiersActive: state.activeTab === 'modifiers',
    isProductGroupsActive: state.activeTab === 'product-groups'
  }
}
