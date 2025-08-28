'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMenucards, useProducts, useCategories, useModifiers, useMenuToggles } from '@/hooks/useMenu'
import MenuTopToggle from '@/components/menu/MenuTopToggle'
import ProductsPanel from '@/components/menu/ProductsPanel'
import CategoriesPanel from '@/components/menu/CategoriesPanel'
import MenucardsPanel from '@/components/menu/MenucardsPanel'
import ModifiersPanel from '@/components/menu/ModifiersPanel'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function MenuPage() {
  const router = useRouter()
  const { data: menucards = [], isLoading: menucardsLoading, error: menucardsError } = useMenucards()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedMenuCard, setSelectedMenuCard] = useState<string | null>(null)

  // Menu editor state
  const [activeTab, setActiveTab] = useState('menucards')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedModifierGroup, setSelectedModifierGroup] = useState<string | null>(null)
  
  const {
    selectedCategories,
    selectedProducts,
    selectedModifierGroups,
    isModifiersActive,
    toggleCategory,
    toggleProduct,
    toggleModifierGroup,
    clearSelections: clearMenuSelections,
    toggleModifiers
  } = useMenuToggles()

  // Load data for counts
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: modifierGroups = [], isLoading: modifierGroupsLoading, error: modifierGroupsError } = useModifiers()
  // Note: productGroups functionality may need to be implemented separately
  const productGroups: any[] = []
  const productGroupsLoading = false
  const productGroupsError = null

  // Notify parent layout that menu-editor is active
  useEffect(() => {
    const event = new CustomEvent('modulesSectionChange', { detail: 'menu-editor' })
    window.dispatchEvent(event)
  }, [])

  // Don't redirect - render menu editor content directly within modules context

  // Handle smooth tab transitions
  const handleTabChange = (tab: typeof activeTab) => {
    if (tab === activeTab) return

    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTab(tab)
      clearSelections()
      setIsTransitioning(false)
    }, 150)
  }

  // Handle menu card selection
  const handleMenuCardSelect = (menuId: string) => {
    setSelectedMenuCard(menuId)
    setActiveTab('menucards')
  }

  // Get current menu card info
  const currentMenuCard = selectedMenuCard ? menucards.find(menu => menu.id === selectedMenuCard) : null

  // Get counts for tabs
  const counts = {
    menucards: menucards.length,
    categories: categories.length,
    products: products.length,
    modifiers: modifierGroups.length,
    productGroups: productGroups.length
  }

  // Check for database setup issues
  const hasErrors = productsError || categoriesError || menucardsError || modifierGroupsError || productGroupsError
  const isLoading = productsLoading || categoriesLoading || menucardsLoading || modifierGroupsLoading || productGroupsLoading

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading menu data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if database issues
  if (hasErrors) {
    return (
      <div className="space-y-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Database Setup Required
                </h3>
                <p className="text-red-800 mb-4">
                  The menu system requires database tables to be set up. Please run the migration scripts:
                </p>
                <div className="bg-red-100 border border-red-300 rounded p-3 font-mono text-sm text-red-900 space-y-1">
                  <div>DEFAULT_MENU_CARD.sql</div>
                  <div>DYNAMIC_PRODUCT_GROUPS.sql</div>
                </div>
                <p className="text-red-700 text-sm mt-3">
                  Run these scripts in your Supabase SQL Editor, then refresh this page.
                </p>
                <div className="mt-4 p-3 bg-red-200 rounded text-sm">
                  <strong>Debug Info:</strong>
                  <div>Products Error: {productsError?.message || 'None'}</div>
                  <div>Categories Error: {categoriesError?.message || 'None'}</div>
                  <div>Menucards Error: {menucardsError?.message || 'None'}</div>
                  <div>Modifier Groups Error: {modifierGroupsError?.message || 'None'}</div>
                  <div>Product Groups Error: {productGroupsError?.message || 'None'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no menu cards exist, show menu card management
  if (menucards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Management</h2>
          <p className="text-gray-600">Create and manage your menu cards</p>
        </div>
        <MenucardsPanel />
      </div>
    )
  }

  // Main menu editor interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Editor</h2>
        <p className="text-gray-600">
          {currentMenuCard ? `Editing: ${currentMenuCard.name}` : 'Select a menu card to edit'}
        </p>
      </div>

      {/* Menu Card Selection */}
      {menucards.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Select Menu Card:</span>
              <div className="flex gap-2">
                {menucards.map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuCardSelect(menu.id)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      selectedMenuCard === menu.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Toggle */}
      <MenuTopToggle
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={counts}
        isLoading={isLoading}
      />

      {/* Content */}
      <div>
        {!isTransitioning && (
          <>
            {activeTab === 'menucards' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <MenucardsPanel />
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <CategoriesPanel />
              </div>
            )}

            {activeTab === 'products' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <ProductsPanel
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                />
              </div>
            )}

            {activeTab === 'modifiers' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <ModifiersPanel />
              </div>
            )}

            {activeTab === 'product-groups' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Product Groups ({productGroups.length})</h3>
                    </div>

                    {productGroups.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No product groups found</p>
                        <p className="text-sm text-gray-500">
                          💡 Go to Products tab → Create/Edit Product → "+ New Group" to create product groups
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {productGroups.map((group) => (
                          <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div>
                              <h4 className="font-medium">{group.name}</h4>
                              {group.description && (
                                <p className="text-sm text-gray-600">{group.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: group.color || '#3B82F6' }}
                                />
                                <span className="text-xs text-gray-500">
                                  Sort: {group.sort_order || 0}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {group.id.slice(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Product groups are created dynamically when editing products.
                        Go to the Products tab and create/edit a product to add new product groups.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}