'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation'
import { useMenuToggles } from '@/hooks/menu/useMenuToggles'
import { useProducts } from '@/hooks/menu/useProducts'
import { useCategories } from '@/hooks/menu/useCategories'
import { useMenucards } from '@/hooks/menu/useMenucards'
import { useModifierGroups } from '@/hooks/menu/useModifierGroups'
import { useProductGroups } from '@/hooks/menu/useProductGroups'
import MenuTopToggle from '@/components/menu/MenuTopToggle'
import ProductsPanel from '@/components/menu/ProductsPanel'
import CategoriesPanel from '@/components/menu/CategoriesPanel'
import MenucardsPanel from '@/components/menu/MenucardsPanel'
import ModifiersPanel from '@/components/menu/ModifiersPanel'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MenuEditorPage() {
  const router = useRouter()
  const { menuId } = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Check if we're in modules context
  const isInModulesContext = pathname.startsWith('/modules')

  const {
    activeTab,
    selectedProduct,
    selectedModifierGroup,
    setActiveTab,
    setSelectedProduct,
    setSelectedModifierGroup,
    clearSelections,
    isModifiersActive
  } = useMenuToggles()

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['menucards', 'categories', 'products', 'modifiers', 'product-groups'].includes(tabParam)) {
      setActiveTab(tabParam as typeof activeTab)
      // Clean up URL
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('tab')
      const newSearch = newSearchParams.toString()
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [searchParams, setActiveTab])

  // Load data for counts
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: menucards = [], isLoading: menucardsLoading, error: menucardsError } = useMenucards()
  const { data: modifierGroups = [], isLoading: modifierGroupsLoading, error: modifierGroupsError } = useModifierGroups()
  const { data: productGroups = [], isLoading: productGroupsLoading, error: productGroupsError } = useProductGroups()

  // Get current menu card info
  const currentMenuCard = menucards.find(menu => menu.id === menuId)

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

  // Check for database setup issues
  const hasErrors = productsError || categoriesError || menucardsError || modifierGroupsError || productGroupsError
  const isLoading = productsLoading || categoriesLoading || menucardsLoading || modifierGroupsLoading || productGroupsLoading



  if (isLoading) {
    return (
      <div className={`${isInModulesContext ? 'space-y-6' : 'p-6 space-y-6'}`}>
        {!isInModulesContext && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/modules')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Editor</h1>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}

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

  if (hasErrors) {
    return (
      <div className={`${isInModulesContext ? 'space-y-6' : 'p-6 space-y-6'}`}>
        {!isInModulesContext && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/modules')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Editor</h1>
              <p className="text-gray-600">Database setup required</p>
            </div>
          </div>
        )}
        
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

  const counts = {
    menucards: menucards.length,
    categories: categories.length,
    products: products.length,
    modifiers: modifierGroups.length,
    productGroups: productGroups.length
  }

  return (
    <div className={`${isInModulesContext ? 'space-y-6' : 'p-6 space-y-6'}`}>
      {/* Header */}
      {!isInModulesContext && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/modules')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu Editor</h1>
              <p className="text-gray-600">
                {currentMenuCard ? `Editing: ${currentMenuCard.name}` : 'Menu Management'}
              </p>
            </div>
          </div>
        </div>
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
            {activeTab === 'products' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <ProductsPanel
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                />
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <CategoriesPanel />
              </div>
            )}

            {activeTab === 'menucards' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <MenucardsPanel />
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