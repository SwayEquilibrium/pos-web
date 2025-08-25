'use client'
import { useEffect, useMemo, useState } from 'react'
import { useCategories, useProductsByCategory, useSubcategories, useCategoryBreadcrumbs, useRootCategories } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useRoomsTables'

import { type SelectedModifier } from '@/hooks/useModifiers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import ModifierSelector from '@/components/ModifierSelector'
import CategoryHierarchy from '@/components/CategoryHierarchy'


export default function OrderPage() {
  const [selectedCat, setSelectedCat] = useState<string|undefined>()
  const [items, setItems] = useState<NewOrderItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('Table 1')
  const [showModifierSelector, setShowModifierSelector] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [navigationStack, setNavigationStack] = useState<Array<{id: string | null, name: string}>>([{id: null, name: 'Menu'}])
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [currentServing, setCurrentServing] = useState(1)
  
  const currentCategoryId = navigationStack[navigationStack.length - 1]?.id
  const { data: cats } = useCategories()
  const { data: rootCategories } = useRootCategories()
  const { data: subcategories } = useSubcategories(currentCategoryId)
  const { data: prods } = useProductsByCategory(selectedCat)
  const { data: tables } = useTables()
  const { data: breadcrumbs } = useCategoryBreadcrumbs(selectedCat)
  const createOrder = useCreateOrder()
  const fireCourse = useFireCourse()
  const fireNext = useFireNextCourse()

  // Load grid settings
  const [gridSettings, setGridSettings] = useState<{
    columns: number
    rows: number
    buttonSize: 'small' | 'medium' | 'large'
    showImages: boolean
    showPrices: boolean
    compactMode: boolean
  }>({
    columns: 4,
    rows: 4,
    buttonSize: 'medium',
    showImages: true,
    showPrices: true,
    compactMode: false
  })

  useEffect(() => {
    const saved = localStorage.getItem('pos-grid-settings')
    if (saved) {
      try {
        setGridSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load grid settings:', error)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsDropdown) {
        setShowSettingsDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSettingsDropdown])

  // Don't auto-select categories - show category navigation instead

  // Test Supabase connection
  useEffect(() => {
    console.log('Categories data:', cats)
    console.log('Root Categories:', rootCategories)
    console.log('Subcategories:', subcategories)
    console.log('Current Category ID:', currentCategoryId)
    console.log('Selected Cat:', selectedCat)
    console.log('Navigation Stack:', navigationStack)
    console.log('Products data:', prods)
    console.log('Tables data:', tables)
  }, [cats, rootCategories, subcategories, prods, tables, currentCategoryId, selectedCat, navigationStack])
  
  const total = useMemo(() => items.reduce((s,i)=> s + (i.unit_price ?? 0) * i.qty, 0), [items])

  const addItem = (product: any) => {
    setSelectedProduct(product)
    setShowModifierSelector(true)
  }

  const handleModifierConfirm = (modifiers: SelectedModifier[], totalPrice: number) => {
    if (!selectedProduct) return
    
    // Prevent double additions by checking if we're already processing
    setItems(prev => {
      // Check if this exact item was just added (within the last 100ms)
      const now = Date.now()
      const recentDuplicate = prev.find(item => 
        item.product_id === selectedProduct.id && 
        item.course_no === currentServing &&
        item.unit_price === totalPrice &&
        (now - (item.added_at || 0)) < 100
      )
      
      if (recentDuplicate) {
        console.log('Prevented duplicate item addition')
        return prev
      }
      
      return [...prev, { 
        product_id: selectedProduct.id, 
        qty: 1, 
        unit_price: totalPrice,
        course_no: currentServing,
        added_at: now, // Add timestamp to track recent additions
        modifiers: modifiers.map(m => ({
          modifier_id: m.modifier_id,
          modifier_name: m.modifier_name,
          price_adjustment: m.price_adjustment
        }))
      }]
    })

    setShowModifierSelector(false)
    setSelectedProduct(null)
  }

  const handleModifierCancel = () => {
    setShowModifierSelector(false)
    setSelectedProduct(null)
  }

  // Navigation functions
  const navigateToCategory = (categoryId: string, categoryName: string) => {
    setNavigationStack(prev => [...prev, { id: categoryId, name: categoryName }])
    setSelectedCat(undefined) // Reset product selection
  }

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1))
      setSelectedCat(undefined) // Reset product selection when going back
    }
  }

  const navigateToRoot = () => {
    setNavigationStack([{id: null, name: 'Menu'}])
    setSelectedCat(undefined)
  }

  const selectCategoryForProducts = (categoryId: string) => {
    const category = (currentCategoryId === null ? rootCategories : subcategories)?.find((cat: any) => cat.id === categoryId)
    if (category) {
      setNavigationStack(prev => [...prev, { id: categoryId, name: `${category.name} - Produkter` }])
    }
    setSelectedCat(categoryId)
  }
  
  const placeOrder = async () => {
    try {
      console.log('Placing order with items:', items)
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'TODO_SUPABASE_URL') {
        // Fallback for demo/testing
        const mockOrderId = 'DEMO-' + Date.now()
        console.log('Using demo mode, order ID:', mockOrderId)
        alert('Demo ordre oprettet: ' + mockOrderId)
        setItems([]) // Clear basket after order
        return
      }
      
      // Use the first available table ID or create takeaway order
      const firstTableId = tables?.[0]?.id
      const orderType = firstTableId ? 'dine_in' : 'takeaway'
      const tableId = firstTableId || null
      
      console.log('Using table ID:', tableId, 'Order type:', orderType)
      
      const id = await createOrder.mutateAsync({ type: orderType, table_id: tableId, items })
      console.log('Order created successfully:', id)
      alert('Ordre oprettet: ' + id)
      setItems([]) // Clear basket after order
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Fejl ved oprettelse af ordre: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }
  
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }



  // Product image mapping
  const getProductImage = (productName: string) => {
    const images: { [key: string]: string } = {
      'Caesar Salat': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop',
      'Bruschetta': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=200&h=200&fit=crop',
      'Bøf med pommes': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
      'Pasta Carbonara': 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=200&h=200&fit=crop',
      'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop',
    }
    return images[productName] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Product Catalog */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              {navigationStack.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={navigateBack}
                  className="p-2"
                >
                  ← Tilbage
                </Button>
              )}
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {navigationStack[navigationStack.length - 1]?.name || 'Menu'}
                </span>
                {navigationStack.length > 1 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {navigationStack.slice(0, -1).map((item, idx) => (
                      <span key={idx}>
                        {item.name} →
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {selectedTable}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Table Overview Button - Always visible */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/tables'}
                className="flex items-center gap-1"
              >
                🪑 Borde
              </Button>

              {/* Takeaway Button */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/takeaway'}
                className="flex items-center gap-1"
              >
                📦 Takeaway
              </Button>
              
              {/* Settings Menu */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSettingsDropdown(!showSettingsDropdown)
                  }}
                >
                  ⚙️ Indstillinger
                </Button>
                {showSettingsDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-2 min-w-48 z-10">
                    <a 
                      href="/settings" 
                      className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => setShowSettingsDropdown(false)}
                    >
                      👤 Min Profil
                    </a>
                    <a 
                      href="/admin" 
                      className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => setShowSettingsDropdown(false)}
                    >
                      🏢 Administration
          </a>
          <a
                      href="/settings" 
                      className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => setShowSettingsDropdown(false)}
                    >
                      ⚙️ Systemindstillinger
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Categories or Products */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div 
            className={`grid gap-${gridSettings.compactMode ? '2' : '4'}`}
            style={{ 
              gridTemplateColumns: `repeat(${gridSettings.columns}, minmax(0, 1fr))` 
            }}
          >
            {/* Show products if a category is selected */}
            {selectedCat && prods?.map(p => (
              <Card 
                key={p.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden hover:border-primary/50"
                onClick={() => addItem(p)}
              >
                {gridSettings.showImages && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img 
                      src={getProductImage(p.name)} 
                      alt={p.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <CardContent className={`p-3 ${!gridSettings.showImages ? 'h-full flex flex-col justify-center' : ''}`}>
                  <h3 className={`font-medium mb-1 ${
                    gridSettings.buttonSize === 'small' ? 'text-xs' : 
                    gridSettings.buttonSize === 'large' ? 'text-base' : 'text-sm'
                  }`}>
                    {p.name}
                  </h3>
                  {gridSettings.showPrices && (
                    <p className={`font-semibold text-primary ${
                      gridSettings.buttonSize === 'small' ? 'text-xs' : 'text-sm'
                    }`}>
                      {p.is_open_price ? 'Åben pris' : `${p.price?.toFixed(0)} kr.`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Show subcategories or root categories if no product category is selected */}
            {!selectedCat && (currentCategoryId === null ? rootCategories : subcategories)?.map((category: any) => {
              const getVisualElement = () => {
                const baseClasses = `text-4xl mb-2`
                
                switch (category.display_style) {
                  case 'emoji':
                    return <div className={baseClasses}>{category.emoji || '📁'}</div>
                  case 'color':
                    return (
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-2"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      >
                        {category.emoji || '📁'}
                      </div>
                    )
                  case 'image':
                    return category.image_thumbnail_url ? (
                      <img 
                        src={category.image_thumbnail_url} 
                        alt={category.name}
                        className="w-16 h-16 rounded-lg object-cover border mb-2"
                      />
                    ) : (
                      <div className={baseClasses}>📷</div>
                    )
                  default:
                    return <div className={baseClasses}>{category.emoji || '📁'}</div>
                }
              }

              return (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden hover:border-blue-200 bg-blue-50"
                  onClick={() => {
                    if (category.has_children) {
                      navigateToCategory(category.id, category.name)
                    } else {
                      selectCategoryForProducts(category.id)
                    }
                  }}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center">
                    {getVisualElement()}
                    
                    <h3 className={`font-medium mb-1 ${
                      gridSettings.buttonSize === 'small' ? 'text-xs' : 
                      gridSettings.buttonSize === 'large' ? 'text-base' : 'text-sm'
                    }`}>
                      {category.name}
                    </h3>
                    
                    {/* Show hierarchy path for subcategories */}
                    {category.full_path && category.full_path.includes(' → ') && (
                      <div className="text-xs text-muted-foreground mb-1 opacity-75">
                        {category.full_path.split(' → ').slice(0, -1).join(' → ')}
                      </div>
                    )}
                    
                    <div className="flex gap-1 text-xs text-muted-foreground flex-wrap justify-center">
                      {category.has_children && (
                        <Badge variant="secondary" className="text-xs">
                          {category.child_categories || 0} kategorier
                        </Badge>
                      )}
                      {category.product_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {category.product_count} produkter
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-card border-t px-6 py-4">
          <div className="flex justify-center gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/favorites'}
              className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100 rounded-full px-4 whitespace-nowrap"
            >
              ⭐ Favoritter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToRoot}
              className="rounded-full px-4 whitespace-nowrap"
            >
              🏠 Menu Hjem
            </Button>
            {selectedCat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCat(undefined)}
                className="rounded-full px-4 whitespace-nowrap"
              >
                📁 Tilbage til kategori
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Order Basket */}
      <div className="w-80 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">🛒 Basket</span>
            </div>
            <span className="text-2xl font-bold text-primary">{total.toFixed(0)} kr.</span>
          </div>
          
          {/* Serving Selector */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Aktuel Servering:</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(servingNum => {
                const servingItems = items.filter(item => item.course_no === servingNum)
                const servingCount = servingItems.length
                
                return (
                  <Button
                    key={servingNum}
                    size="sm"
                    variant={currentServing === servingNum ? "default" : "outline"}
                    onClick={() => setCurrentServing(servingNum)}
                    className="flex-1 relative"
                  >
                    Ret {servingNum}
                    {servingCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs p-0 bg-blue-600 text-white"
                      >
                        {servingCount}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Produkter tilføjes til Ret {currentServing}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {(() => {
            // Filter items for current serving
            const currentServingItems = items.filter(item => item.course_no === currentServing)
            const allServingItems = items.reduce((acc, item) => {
              const serving = item.course_no || 1
              if (!acc[serving]) acc[serving] = []
              acc[serving].push(item)
              return acc
            }, {} as Record<number, typeof items>)
            
            // Get total for current serving
            const currentServingTotal = currentServingItems.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.qty, 0)
            
            return (
              <>
                {/* Current Serving Items */}
                {currentServingItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Ingen varer i Ret {currentServing}</p>
                    <p className="text-sm mt-1">Tilføj produkter fra menuen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-muted-foreground">Ret {currentServing}</h3>
                      <span className="text-sm font-semibold">{currentServingTotal.toFixed(0)} kr.</span>
                    </div>
                    
                    {currentServingItems.map((item, idx) => {
                      const globalIdx = items.findIndex(i => i === item)
                      return (
                        <div key={globalIdx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                              {item.qty}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">Product #{item.product_id.slice(0, 8)}</p>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {item.modifiers.map((mod, modIdx) => (
                                    <span key={modIdx} className="mr-1">
                                      +{mod.modifier_name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{(item.unit_price ?? 0).toFixed(0)} kr.</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(globalIdx)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {/* Other Servings Summary */}
                {Object.keys(allServingItems).length > 1 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Andre retter:</h4>
                    <div className="space-y-1">
                      {Object.entries(allServingItems)
                        .filter(([serving]) => parseInt(serving) !== currentServing)
                        .map(([serving, servingItems]) => (
                          <div key={serving} className="flex items-center justify-between text-xs">
                            <button
                              onClick={() => setCurrentServing(parseInt(serving))}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ret {serving} ({servingItems.length} {servingItems.length === 1 ? 'vare' : 'varer'})
                            </button>
                            <span className="text-muted-foreground">
                              {servingItems.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.qty, 0).toFixed(0)} kr.
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t space-y-3">
            <Button 
              onClick={placeOrder} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              🛒 Send order
            </Button>
            
            <Button 
              variant="secondary"
              className="w-full h-12 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold"
            >
              💳 Go to payment
            </Button>
          </div>
        )}
      </div>

      {/* Modifier Selector Modal */}
      {showModifierSelector && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ModifierSelector
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            basePrice={selectedProduct.is_open_price ? Number(prompt('Pris?') || '0') : selectedProduct.price}
            onConfirm={handleModifierConfirm}
            onCancel={handleModifierCancel}
          />
        </div>
      )}
    </div>
  )
}
