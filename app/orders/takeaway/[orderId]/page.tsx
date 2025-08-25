'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCategories, useProductsByCategory, useSubcategories, useCategoryBreadcrumbs, useRootCategories } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'
import { useTakeawayOrders, useUpdateTakeawayOrder } from '@/hooks/useTakeawayOrders'
import { type SelectedModifier } from '@/hooks/useModifiers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import ModifierSelector from '@/components/ModifierSelector'
import CategoryHierarchy from '@/components/CategoryHierarchy'

export default function TakeawayOrderPage() {
  const { orderId } = useParams() as { orderId: string }
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string|undefined>()
  const [items, setItems] = useState<NewOrderItem[]>([])
  const [showModifierSelector, setShowModifierSelector] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [navigationStack, setNavigationStack] = useState<Array<{id: string | null, name: string}>>([{id: null, name: 'Menu'}])
  const [currentServing, setCurrentServing] = useState(1)
  
  const currentCategoryId = navigationStack[navigationStack.length - 1]?.id
  const { data: cats } = useCategories()
  const { data: rootCategories } = useRootCategories()
  const { data: subcategories } = useSubcategories(currentCategoryId)
  const { data: prods } = useProductsByCategory(selectedCat)
  const { data: takeawayOrders } = useTakeawayOrders()
  const createOrder = useCreateOrder()
  const updateTakeawayOrder = useUpdateTakeawayOrder()

  // Find the current takeaway order
  const currentOrder = takeawayOrders?.find(order => order.id === orderId)

  // Load grid settings
  const [gridSettings, setGridSettings] = useState<{
    columns: number
    rows: number
    buttonSize: 'small' | 'medium' | 'large'
    showImages: boolean
    showPrices: boolean
    compactMode: boolean
  }>({
    columns: 6,
    rows: 4,
    buttonSize: 'medium',
    showImages: true,
    showPrices: true,
    compactMode: false
  })

  useEffect(() => {
    const saved = localStorage.getItem('pos-grid-settings')
    if (saved) {
      setGridSettings(JSON.parse(saved))
    }
  }, [])

  const total = useMemo(() => items.reduce((s,i)=> s + (i.unit_price ?? 0) * i.qty, 0), [items])

  const navigateToCategory = (categoryId: string, categoryName: string) => {
    setNavigationStack(prev => [...prev, {id: categoryId, name: categoryName}])
    setSelectedCat(undefined)
  }

  const selectCategoryForProducts = (categoryId: string) => {
    setSelectedCat(categoryId)
    const category = cats?.find(c => c.id === categoryId)
    if (category) {
      setNavigationStack(prev => [...prev, {id: categoryId, name: category.name}])
    }
  }

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1)
      setNavigationStack(newStack)
      setSelectedCat(undefined)
    }
  }

  const addItem = (p: any) => {
    setSelectedProduct(p)
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

  const placeOrder = async () => {
    if (!orderId) return
    
    try {
      // Create the order items
      await createOrder.mutateAsync({ 
        type: 'takeaway', 
        table_id: null, 
        items 
      })
      
      // Update takeaway order status
      await updateTakeawayOrder.mutateAsync({
        id: orderId,
        status: 'preparing'
      })
      
      alert('Takeaway ordre opdateret!')
      router.push('/')
    } catch (error) {
      console.error('Error updating takeaway order:', error)
      alert('Fejl ved opdatering af ordre: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
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

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Takeaway ordre ikke fundet</h2>
          <Button onClick={() => router.push('/')}>
            Tilbage til Menu
          </Button>
        </Card>
      </div>
    )
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
              
              {/* Order Info */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-lg font-semibold">
                    Takeaway #{currentOrder.order_number}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {currentOrder.customer_name}
                    {currentOrder.customer_phone && ` • ${currentOrder.customer_phone}`}
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  📦 Takeaway
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Back to Menu Button */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => router.push('/takeaway')}
                className="flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbage til Takeaway
              </Button>
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
            {!selectedCat && (currentCategoryId === null ? rootCategories : subcategories)?.map((category: any) => (
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
                  <div className="text-4xl mb-2">{category.emoji || '📁'}</div>
                  <h3 className="font-medium mb-1 text-sm">
                    {category.name}
                  </h3>
                  {category.product_count > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {category.product_count} produkter
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Order Basket */}
      <div className="w-96 bg-card border-l flex flex-col">
        {/* Serving Selector */}
        <div className="p-4 border-b bg-muted/30">
          <Label className="text-sm font-medium mb-2 block">Aktiv Ret</Label>
          <div className="flex gap-2">
            {[1, 2, 3].map(serving => {
              const servingItemCount = items.filter(item => item.course_no === serving).length
              return (
                <Button
                  key={serving}
                  variant={currentServing === serving ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentServing(serving)}
                  className="flex-1 relative"
                >
                  Ret {serving}
                  {servingItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                      {servingItemCount}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
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

        {/* Order Summary & Actions */}
        <div className="p-6 border-t bg-muted/30">
          <div className="flex items-center justify-between text-lg font-semibold mb-4">
            <span>Total:</span>
            <span>{total.toFixed(0)} kr.</span>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={placeOrder} 
              disabled={items.length === 0 || createOrder.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {createOrder.isPending ? 'Opdaterer...' : 'Opdater Takeaway Ordre'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Annuller
            </Button>
          </div>
        </div>
      </div>

      {/* Modifier Selector Modal */}
      {showModifierSelector && selectedProduct && (
        <ModifierSelector
          product={selectedProduct}
          onConfirm={handleModifierConfirm}
          onCancel={() => {
            setShowModifierSelector(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
