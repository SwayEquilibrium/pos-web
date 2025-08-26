'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'
import { useRecordPayment } from '@/hooks/usePayments'
import { useTables } from '@/hooks/useRoomsTables'
import { type SelectedModifier } from '@/hooks/useModifiers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Star, Search, X } from 'lucide-react'
import ModifierSelector from '@/components/ModifierSelector'
import BasketItemEditor, { BasketItem } from '@/components/BasketItemEditor'
import PaymentModal, { PaymentDetails } from '@/components/PaymentModal'
import { showToast } from '@/lib/toast'

// Favorites interface and functionality
interface FavoriteItem {
  id: string
  type: 'category' | 'product'
  name: string
  data: any
  position: number
}

export default function OrderPage() {
  const { tableId } = useParams() as { tableId: string }
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string|undefined>()
  const [items, setItems] = useState<BasketItem[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number>(1) // Default to starter
  const [showModifierSelector, setShowModifierSelector] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showBasketItemEditor, setShowBasketItemEditor] = useState(false)
  const [selectedBasketItem, setSelectedBasketItem] = useState<BasketItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [editFavoritesMode, setEditFavoritesMode] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Get menu data from database
  const { data: cats } = useCategories()
  const { data: prods } = useProductsByCategory(selectedCat === 'favorites' ? undefined : selectedCat)
  const { data: allProducts } = useProductsByCategory() // Get all products for search
  const { data: tables } = useTables()
  const createOrder = useCreateOrder()
  const fireCourse = useFireCourse()
  const fireNext = useFireNextCourse()
  const recordPayment = useRecordPayment()

  // Get the current table info
  const currentTable = tables?.find(table => table.id === tableId)

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pos-favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load favorites:', error)
      }
    }
  }, [])

  useEffect(() => { 
    if (!selectedCat && cats?.length) setSelectedCat(cats[0].id) 
  }, [cats, selectedCat])
  
  const total = useMemo(() => {
    const calculatedTotal = items.reduce((s,i)=> s + (i.unit_price ?? 0) * i.qty, 0)
    // Ensure minimum positive amount for payment system
    return Math.max(0.01, calculatedTotal)
  }, [items])

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { categories: [], products: [] }
    
    const term = searchTerm.toLowerCase()
    
    const matchingCategories = cats?.filter(cat => 
      cat.name.toLowerCase().includes(term)
    ) || []
    
    const matchingProducts = allProducts?.filter(prod => 
      prod.name.toLowerCase().includes(term) || 
      prod.description?.toLowerCase().includes(term)
    ) || []
    
    return { categories: matchingCategories, products: matchingProducts }
  }, [searchTerm, cats, allProducts])

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowSearchResults(value.trim().length > 0)
    if (value.trim().length > 0) {
      setSelectedCat('search') // Special category for search results
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setShowSearchResults(false)
    setSelectedCat(cats?.[0]?.id || undefined)
  }

  // Favorites helper functions
  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    setFavorites(newFavorites)
    localStorage.setItem('pos-favorites', JSON.stringify(newFavorites))
  }

  const addToFavorites = (type: 'category' | 'product', data: any) => {
    const newFavorite: FavoriteItem = {
      id: `${type}-${data.id}`,
      type,
      name: data.name,
      data,
      position: favorites.length
    }
    
    if (favorites.find(f => f.id === newFavorite.id)) {
      alert('Dette element er allerede i favoritter!')
      return
    }

    saveFavorites([...favorites, newFavorite])
  }

  const removeFromFavorites = (favoriteId: string) => {
    saveFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  const handleFavoriteClick = (favorite: FavoriteItem) => {
    if (favorite.type === 'category') {
      setSelectedCat(favorite.data.id)
    } else {
      // Add product directly to basket
      setSelectedProduct(favorite.data)
      setShowModifierSelector(true)
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: string } = {
      'Forretter': '🥗',
      'Hovedretter': '🍽️',
      'Desserter': '🍰',
      'Drikkevarer': '🥤',
      'Pizza': '🍕',
      'Burger': '🍔'
    }
    return icons[categoryName] || '📁'
  }

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

  const addItem = (p: any) => {
    setSelectedProduct(p)
    setShowModifierSelector(true)
  }

  const handleModifierConfirm = (modifiers: SelectedModifier[], totalPrice: number) => {
    if (!selectedProduct) return
    
    const newItem: BasketItem = {
      id: `${Date.now()}-${Math.random()}`, // Generate unique ID
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      qty: 1,
      unit_price: totalPrice,
      original_price: selectedProduct.price,
      modifiers,
      course_no: selectedCourse
    }
    
    setItems(prev => [...prev, newItem])
    setShowModifierSelector(false)
    setSelectedProduct(null)
  }

  const handleBasketItemClick = (item: BasketItem) => {
    setSelectedBasketItem(item)
    setShowBasketItemEditor(true)
  }

  const handleBasketItemSave = (updatedItem: BasketItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
  }

  const handleBasketItemDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }
  
  const placeOrder = async () => {
    // Convert BasketItems to NewOrderItems for the API
    const orderItems: NewOrderItem[] = items.map(item => ({
      product_id: item.product_id,
      qty: item.qty,
      unit_price: item.unit_price,
      course_no: item.course_no,
      modifiers: item.modifiers?.map(m => ({
        modifier_id: m.modifier_id,
        modifier_name: m.modifier_name,
        price_adjustment: m.price_adjustment
      }))
    }))
    
    const id = await createOrder.mutateAsync({ type: 'dine_in', table_id: tableId, items: orderItems })
    alert('Ordre oprettet: ' + id)
    setItems([]) // Clear basket after successful order
  }

  const handlePayment = () => {
    if (items.length === 0) {
      alert('Tilføj varer til kurven først')
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = async (paymentDetails: PaymentDetails) => {
    try {
      // First create the order if there are items in the basket
      let orderId: string | undefined
      
      if (items.length > 0) {
        // Convert BasketItems to NewOrderItems for the API
        const orderItems: NewOrderItem[] = items.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          unit_price: item.unit_price,
          course_no: item.course_no,
          modifiers: item.modifiers?.map(m => ({
            modifier_id: m.modifier_id,
            modifier_name: m.modifier_name,
            price_adjustment: m.price_adjustment
          }))
        }))
        
        // Create the order
        orderId = await createOrder.mutateAsync({ 
          type: 'dine_in', 
          table_id: tableId, 
          items: orderItems 
        })
        
        console.log('Order created:', orderId)
      }
      
      // Record the payment
      console.log('[handlePaymentComplete] Recording payment:', {
        orderId,
        paymentDetails,
        totalAmount: total
      })
      
      const paymentTransactionId = await recordPayment.mutateAsync({
        order_id: orderId || 'no-order',
        amount: paymentDetails.amount || total,
        payment_method: paymentDetails.method || 'CASH',
        transaction_id: paymentDetails.transactionId,
        cash_received: paymentDetails.cashReceived,
        change_given: paymentDetails.changeGiven,
        metadata: {
          customer_group: paymentDetails.customerGroup,
          discount_amount: paymentDetails.discountAmount,
          gift_card_code: paymentDetails.giftCardCode
        }
      })
      
      console.log('Payment recorded:', paymentTransactionId)
      
      // Show payment completion toast
      showToast.success(
        `Betaling gennemført! ${paymentDetails.method}: ${paymentDetails.amount} kr${
          paymentDetails.cashReceived ? ` (Modtaget: ${paymentDetails.cashReceived} kr, Byttepenge: ${paymentDetails.changeGiven} kr)` : ''
        }`
      )
      
      // Clear basket after successful payment
      setItems([])
      
    } catch (error) {
      console.error('Payment processing failed:', error)
      showToast.error('Fejl ved behandling af betaling: ' + (error as Error).message)
    }
  }
  
  const handleFireNext = async () => {
    const orderId = prompt('Order ID at fire next course for:'); if (!orderId) return
    const next = await fireNext.mutateAsync(orderId); alert(next ? `Kørte ret ${next}` : 'Ingen ret at køre')
  }
  
  const handleFireX = async () => {
    const orderId = prompt('Order ID:'); const x = Number(prompt('Ret nr.:')); if (!orderId || !x) return
    await fireCourse.mutateAsync({ order_id: orderId, course_no: x }); alert('Kørte ret ' + x)
  }



  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Product Catalog */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                onClick={() => router.push('/tables')} 
                variant="ghost" 
                size="sm"
              >
                ← Back
              </Button>
              <span className="text-sm text-muted-foreground">🔍 Details</span>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                🗑️ Clear table
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">
                {currentTable ? currentTable.name : `Table ${tableId}`}
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-6 flex flex-col max-w-6xl mx-auto w-full">
          {selectedCat === 'favorites' ? (
            /* Favorites Grid */
            <div className="flex flex-col flex-1">
              {/* Favorites Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Favorites ({favorites.length})</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditFavoritesMode(!editFavoritesMode)}
                >
                  {editFavoritesMode ? 'Done' : 'Edit'}
                </Button>
              </div>

              {favorites.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-4">No favorites yet</p>
                    <Button onClick={() => setEditFavoritesMode(true)} variant="outline">
                      Add Favorites
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-4 w-full">
                  {favorites.slice(0, 24).map(favorite => (
                    <div key={favorite.id} className="relative">
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden hover:border-primary/50 aspect-square"
                        onClick={() => editFavoritesMode ? undefined : handleFavoriteClick(favorite)}
                      >
                        <div className="h-2/3 overflow-hidden bg-muted">
                          {favorite.type === 'product' ? (
                            <img 
                              src={getProductImage(favorite.name)} 
                              alt={favorite.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-3xl">{getCategoryIcon(favorite.name)}</span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2 h-1/3 flex flex-col justify-center">
                          <h3 className="font-medium text-sm text-center leading-tight">{favorite.name}</h3>
                          {favorite.type === 'product' && favorite.data.price && (
                            <p className="text-sm font-semibold text-primary text-center">
                              {favorite.data.is_open_price ? 'Open price' : `${favorite.data.price?.toFixed(2)} DKK`}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Edit Mode - Remove Button */}
                      {editFavoritesMode && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full z-10"
                          onClick={() => removeFromFavorites(favorite.id)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Fill remaining grid spots with empty placeholders */}
                  {Array.from({ length: 24 - Math.min(favorites.length, 24) }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
                      {editFavoritesMode && (
                        <span className="text-muted-foreground/40 text-sm">Empty</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add to Favorites Section (Edit Mode) */}
              {editFavoritesMode && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Add Categories</h4>
                    <div className="grid grid-cols-6 gap-4">
                      {cats?.map(category => (
                        <Button
                          key={category.id}
                          variant="outline"
                          size="sm"
                          className="h-20 flex-col gap-2 text-xs p-2"
                          onClick={() => addToFavorites('category', category)}
                          disabled={favorites.some(f => f.id === `category-${category.id}`)}
                        >
                          <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                          <span className="text-center leading-tight">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>To add products to favorites, browse to a category and click the star icon on products.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regular Products Grid */
            <div className="grid grid-cols-6 gap-4 w-full">
              {prods?.map(p => (
                <Card 
                  key={p.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden hover:border-primary/50 relative aspect-square"
                  onClick={() => addItem(p)}
                >
                  {/* Add to Favorites Button */}
                  {editFavoritesMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 w-6 h-6 p-0 rounded-full bg-white/80 hover:bg-white z-10"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        addToFavorites('product', p)
                      }}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <div className="h-2/3 overflow-hidden bg-muted relative">
                    {p.display_style === 'image' && p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : p.display_style === 'color' ? (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: p.color || '#10B981' }}
                      >
                        {p.name.charAt(0)}
                      </div>
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-4xl"
                        style={{ backgroundColor: p.color || '#f3f4f6' }}
                      >
                        {p.emoji || '🍽️'}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2 h-1/3 flex flex-col justify-center">
                    <h3 className="font-medium text-sm text-center leading-tight">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-gray-500 text-center leading-tight mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-primary text-center mt-1">
                      {p.is_open_price ? 'Åben pris' : `${p.price?.toFixed(2)} kr`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Category Filters - Fixed/Sticky */}
        <div className="bg-card border-t px-6 py-6 sticky bottom-0 z-40">
          <div className="flex justify-center gap-3 flex-wrap">
            {/* Favorites Button */}
            <Button
              onClick={() => setSelectedCat('favorites')}
              variant={selectedCat === 'favorites' ? "default" : "outline"}
              size="lg"
              className={`rounded-full px-6 py-3 h-12 flex items-center gap-2 text-base font-medium ${
                selectedCat === 'favorites' 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' 
                  : 'border-amber-300 text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Star className={`w-5 h-5 ${selectedCat === 'favorites' ? 'fill-current' : ''}`} />
              Favorites
              {favorites.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`ml-2 h-6 px-2 text-sm ${
                    selectedCat === 'favorites' 
                      ? 'bg-amber-600 text-amber-100' 
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {favorites.length}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={() => setSelectedCat(undefined)}
              variant={!selectedCat || selectedCat === 'favorites' ? "ghost" : "default"}
              size="lg"
              className="rounded-full px-6 py-3 h-12 text-base font-medium"
            >
              All
            </Button>
            {cats?.map(c => (
              <Button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                variant={selectedCat === c.id ? "default" : "ghost"}
                size="lg"
                className="rounded-full px-6 py-3 h-12 text-base font-medium flex items-center gap-2"
                style={c.display_style === 'color' ? { 
                  backgroundColor: selectedCat === c.id ? c.color : 'transparent',
                  borderColor: c.color,
                  color: selectedCat === c.id ? 'white' : c.color
                } : {}}
              >
                {c.emoji && <span>{c.emoji}</span>}
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Order Basket */}
      <div className="w-80 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Basket</h2>
            <span className="text-sm text-muted-foreground">{items.length} items</span>
          </div>
          
          {/* Course Selection - Simplified */}
          <div className="mb-4">
            <span className="text-sm font-medium mb-2 block">Servering:</span>
            <div className="flex gap-1 overflow-x-auto pb-2">
              <Button
                variant={selectedCourse === 1 ? "default" : "outline"}
                size="sm"
                className="h-8 px-4 text-xs whitespace-nowrap"
                onClick={() => setSelectedCourse(1)}
              >
                Servering 1
              </Button>
              <Button
                variant={selectedCourse === 2 ? "default" : "outline"}
                size="sm"
                className="h-8 px-4 text-xs whitespace-nowrap"
                onClick={() => setSelectedCourse(2)}
              >
                Servering 2
              </Button>
              <Button
                variant={selectedCourse === 3 ? "default" : "outline"}
                size="sm"
                className="h-8 px-4 text-xs whitespace-nowrap"
                onClick={() => setSelectedCourse(3)}
              >
                Servering 3
              </Button>
              {/* Additional servings - only show if items exist in them or if currently selected */}
              {(items.some(item => item.course_no && item.course_no > 3) || selectedCourse > 3) && (
                <>
                  {[4, 5, 6, 7, 8, 9, 10].map(courseNum => (
                    (items.some(item => item.course_no === courseNum) || selectedCourse === courseNum) && (
                      <Button
                        key={courseNum}
                        variant={selectedCourse === courseNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-4 text-xs whitespace-nowrap"
                        onClick={() => setSelectedCourse(courseNum)}
                      >
                        Servering {courseNum}
                      </Button>
                    )
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items in basket</p>
              <p className="text-sm mt-1">Select items from menu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generate servings dynamically */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(servingNum => (
                items.some(item => item.course_no === servingNum) && (
                  <div key={`serving-${servingNum}`}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {servingNum}
                      </span>
                      Servering {servingNum}
                    </h3>
                    <div className="space-y-2 pl-8">
                      {items.filter(item => item.course_no === servingNum).map((item, idx) => (
                        <div 
                          key={`serving${servingNum}-${idx}`} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleBasketItemClick(item)}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="w-5 h-5 rounded-full flex items-center justify-center text-xs">
                              {item.qty}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{item.product_name}</p>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {item.modifiers.map((mod, modIdx) => (
                                    <span key={modIdx} className="mr-1">
                                      +{mod.modifier_name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.kitchen_note && (
                                <div className="text-xs text-blue-600">
                                  📝 {item.kitchen_note}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {(item.unit_price ?? 0).toFixed(2)} DKK
                            </span>
                            <div className="text-xs text-muted-foreground">
                              ✏️
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="sticky bottom-0 p-6 border-t bg-card shadow-lg z-30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold">{total.toFixed(2)} DKK</span>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handlePayment} 
                className="w-full h-12 font-semibold bg-green-600 hover:bg-green-700"
              >
                💳 Betal ({total.toFixed(2)} DKK)
              </Button>
              
              <Button 
                onClick={placeOrder} 
                variant="outline"
                className="w-full h-10 font-semibold"
              >
                📝 Send ordre (uden betaling)
              </Button>
              
              <Button 
                onClick={() => setItems([])} 
                variant="destructive"
                className="w-full h-10 font-semibold mt-2"
              >
                🗑️ Ryd kurv
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button 
                onClick={handleFireNext} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                Fire Next
              </Button>
              <Button 
                onClick={handleFireX} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                Fire Course
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modifier Selector Modal */}
      {showModifierSelector && selectedProduct && (
        <ModifierSelector
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            is_open_price: selectedProduct.is_open_price || false
          }}
          onConfirm={handleModifierConfirm}
          onCancel={() => {
            setShowModifierSelector(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {/* Basket Item Editor Modal */}
      {showBasketItemEditor && selectedBasketItem && (
        <BasketItemEditor
          isOpen={showBasketItemEditor}
          onClose={() => {
            setShowBasketItemEditor(false)
            setSelectedBasketItem(null)
          }}
          item={selectedBasketItem}
          onSave={handleBasketItemSave}
          onDelete={handleBasketItemDelete}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          totalAmount={total}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}
