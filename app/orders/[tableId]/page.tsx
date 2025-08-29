'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  useActiveMenuData
} from '@/hooks/useMenu'
import { useCreateOrder } from '@/hooks/useOrders'
import { usePrintCustomerReceipt, useBusinessInfo } from '@/hooks/useCustomerReceipts'
import { useTables } from '@/hooks/useRoomsTables'
import { type SelectedModifier } from '@/hooks/useMenu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Star, Search, X, Loader2, AlertCircle } from 'lucide-react'
// ModifierSelector import removed - products go directly to basket
import BasketItemEditor, { BasketItem } from '@/components/BasketItemEditor'
import PaymentModal, { PaymentDetails } from '@/components/PaymentModal'
import { showToast } from '@/lib/toast'
import { useAutoPrintReceipt } from '@/hooks/usePrinters'

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
  const [showBasketItemEditor, setShowBasketItemEditor] = useState(false)
  const [selectedBasketItem, setSelectedBasketItem] = useState<BasketItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Animation states
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const [justAddedItemId, setJustAddedItemId] = useState<string | null>(null)
  
  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [editFavoritesMode, setEditFavoritesMode] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Get active menu data (categories and products from active menucard)
  const { 
    data: activeMenu, 
    isLoading: menuLoading, 
    error: menuError 
  } = useActiveMenuData()
  
  // Extract categories and products from active menu
  const cats = activeMenu?.categories || []
  const prods = activeMenu?.products || []
  const allProducts = prods // For search functionality
  
  // Check if there's an active menu
  const hasActiveMenu = activeMenu && activeMenu.menucard
  
  // Filter products by selected category
  const filteredProducts = selectedCat && selectedCat !== 'favorites' 
    ? prods.filter(product => product.category_id === selectedCat)
    : prods
  
  const { data: tables } = useTables()
  const createOrder = useCreateOrder()
  // TODO: Implement course firing functionality
  const fireCourse = () => console.log('Course firing not implemented yet')
  const fireNext = () => console.log('Next course not implemented yet')
  // TODO: Implement payment functionality
  const recordPayment = () => console.log('Payment not implemented yet')
  const isRecording = false
  const error = null
  const printCustomerReceipt = usePrintCustomerReceipt()
  const businessInfo = useBusinessInfo()
  const autoPrintReceipt = useAutoPrintReceipt()

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
    // Don't auto-select a category - let user choose "All" by default
    // if (!selectedCat && cats?.length) setSelectedCat(cats[0].id) 
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
    setSelectedCat(undefined) // Go back to "All" instead of auto-selecting first category
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

  const addItem = async (p: any) => {
    console.log('[addItem] Product clicked:', p)
    
    // Start animation
    setAddingProductId(p.id)
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      console.log('[addItem] Adding product directly to basket')
      
      // Check if this exact product already exists in basket
      const existingItem = items.find(item => item.product_id === p.id)
      
      if (existingItem) {
        console.log('[addItem] Item already exists, incrementing quantity')
        // Increment quantity instead of adding duplicate
        setItems(prev => prev.map(item => 
          item.id === existingItem.id 
            ? { ...item, qty: item.qty + 1 }
            : item
        ))
        setJustAddedItemId(existingItem.id)
      } else {
        // Add new item directly to basket
        const newItemId = `${Date.now()}-${Math.random()}`
        const newItem: BasketItem = {
          id: newItemId,
          product_id: p.id,
          product_name: p.name,
          qty: 1,
          unit_price: p.price || 0,
          original_price: p.price || 0,
          modifiers: [], // No modifiers for now
          course_no: selectedCourse
        }
        
        console.log('[addItem] Adding new item to basket:', newItem)
        setItems(prev => [...prev, newItem])
        setJustAddedItemId(newItemId)
      }
      
      // Trigger "just added" animation
      setTimeout(() => {
        setJustAddedItemId(null)
      }, 800)
      
      setAddingProductId(null)
    }, 200)
  }

  // handleModifierConfirm function removed - products go directly to basket

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
    // Convert BasketItems to the format expected by createOrder
    const orderItems = items.map(item => {
      // Find the product to get category information
      const product = prods.find(p => p.id === item.product_id)
      const category = cats.find(c => c.id === product?.category_id)
      
      return {
        product_id: item.product_id,
        category_id: product?.category_id || '',
        quantity: item.qty,
        unit_price: item.unit_price,
        product_name: item.product_name,
        category_name: category?.name || 'Unknown',
        special_instructions: item.kitchen_note
      }
    })
    
    try {
      const order = await createOrder.mutateAsync({
        table_id: tableId,
        items: orderItems
      })

      console.log('✅ Order created successfully:', order)
      console.log('📋 Order items for printing:', orderItems)

      // AUTOMATIC PRINTING - Print kitchen receipt for the new order
      try {
        console.log('🖨️ Triggering automatic printing for order:', order.id)

        const printData = {
          orderId: order.id,
          orderNumber: order.order_number || `T${tableId}-${Date.now()}`,
          totalAmount: order.total_amount,
          tableName: currentTable?.name || `Table ${tableId}`,
          items: orderItems.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.unit_price * item.quantity,
            category: item.category_name,
            specialInstructions: item.special_instructions
          }))
        }

        console.log('🖨️ Sending print data:', printData)

        const printResult = await autoPrintReceipt.mutateAsync({
          context: 'order',
          data: printData
        })

        console.log('✅ Automatic printing result:', printResult)

        if (printResult && printResult.length > 0) {
          console.log(`🖨️ Printed to ${printResult.length} printer(s) successfully`)
        } else {
          console.log('⚠️ No printers were available for printing')
        }

      } catch (printError) {
        console.error('❌ Automatic printing failed:', printError)
        console.error('❌ Print error details:', printError)
        // Don't throw - printing failure shouldn't break order creation
        // But show user that order was created
        alert(`Ordre oprettet: ${order.id}\n⚠️ Advarsel: Udskrivning fejlede`)
      }

      alert('Ordre oprettet: ' + order.id)
      setItems([]) // Clear basket after successful order
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Fejl ved oprettelse af ordre: ' + (error as Error).message)
    }
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
        transaction_id: paymentDetails.reference,
        cash_received: undefined, // Not available in current PaymentDetails
        change_given: paymentDetails.change,
        metadata: {
          customer_group: paymentDetails.customer_group_id,
          gift_card_balance: paymentDetails.gift_card_balance
        }
      })
      
      console.log('Payment recorded:', paymentTransactionId)
      
      // Print customer receipt if configured
      try {
        if (orderId && items.length > 0) {
          console.log('🧾 Printing customer receipt...')
          
          const receiptResult = await printCustomerReceipt.mutateAsync({
            orderId,
            orderType: 'dine_in',
            tableId,
            items: items.map(item => ({
              name: item.product_name || 'Unknown Product',
              quantity: item.qty,
              unit_price: item.unit_price,
              modifiers: item.modifiers?.map(m => ({
                modifier_name: m.modifier_name,
                price_adjustment: m.price_adjustment
              }))
            })),
            paymentInfo: {
              method: paymentDetails.method || 'CASH',
              amount: paymentDetails.amount || total,
              cash_received: undefined, // Not available in current PaymentDetails
              change_given: paymentDetails.change,
              transaction_id: paymentTransactionId?.id || paymentDetails.reference
            },
            businessInfo
          })
          
          if (receiptResult.success) {
            console.log('✅ Customer receipt printed:', receiptResult.message)
          }
        }
      } catch (receiptError) {
        console.error('❌ Customer receipt printing failed:', receiptError)
        // Don't throw - receipt failure shouldn't break payment flow
      }
      
      // Show payment completion toast
      showToast.success(
        `Betaling gennemført! ${paymentDetails.method}: ${paymentDetails.amount} kr${
          paymentDetails.change ? ` (Byttepenge: ${paymentDetails.change} kr)` : ''
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
    try {
      const orderId = prompt(`🔥 Fire Next Course\n\nEnter Order ID for ${currentTable?.name || `Table ${tableId}`}:`);
      if (!orderId) return;
      
      const nextCourse = await fireNext.mutateAsync(orderId);
      if (nextCourse) {
        showToast(`✅ Fired Course ${nextCourse} for Order ${orderId}`, 'success');
      } else {
        showToast(`ℹ️ No more courses to fire for Order ${orderId}`, 'info');
      }
    } catch (error) {
      console.error('Failed to fire next course:', error);
      showToast('❌ Failed to fire next course', 'error');
    }
  }
  
  const handleFireX = async () => {
    try {
      const orderId = prompt(`🎯 Fire Specific Course\n\nEnter Order ID for ${currentTable?.name || `Table ${tableId}`}:`);
      if (!orderId) return;
      
      const courseNumber = Number(prompt('Enter Course Number (1-10):'));
      if (!courseNumber || courseNumber < 1 || courseNumber > 10) {
        showToast('❌ Please enter a valid course number (1-10)', 'error');
        return;
      }
      
      await fireCourse.mutateAsync({ order_id: orderId, course_no: courseNumber });
      showToast(`✅ Fired Course ${courseNumber} for Order ${orderId}`, 'success');
    } catch (error) {
      console.error('Failed to fire course:', error);
      showToast('❌ Failed to fire course', 'error');
    }
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

        {/* Active Menu Check */}
        {!menuLoading && !hasActiveMenu && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">No Active Menu Set</span>
                <span className="text-sm">Orders cannot be placed without an active menu</span>
              </div>
              <Button 
                onClick={() => router.push('/modules/menu')}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Set Active Menu
              </Button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 p-6 flex flex-col max-w-6xl mx-auto w-full">
          {/* Debug Info - Remove in production */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <div className="grid grid-cols-4 gap-4">
              <div>
                Active Menu: {hasActiveMenu ? activeMenu?.menucard?.name : 'None'}
              </div>
              <div>Categories: {cats?.length || 0}</div>
              <div>Total Products: {prods?.length || 0}</div>
              <div>Selected: {selectedCat ? cats?.find(c => c.id === selectedCat)?.name : 'All'} ({filteredProducts?.length || 0} products)</div>
            </div>
          </div>
          
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
                                             {menuLoading ? (
                        <div className="col-span-6 text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">Loading categories...</span>
                        </div>
                                             ) : menuError ? (
                        <div className="col-span-6 text-center py-8 text-red-600">
                          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-sm">Failed to load categories</span>
                        </div>
                      ) : cats && cats.length > 0 ? (
                        cats.map(category => (
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
                        ))
                      ) : (
                        <div className="col-span-6 text-center py-8 text-muted-foreground">
                          <span className="text-sm">No categories available</span>
                        </div>
                      )}
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
              {/* Products Loading State */}
              {menuLoading && (
                <div className="col-span-6 flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading active menu...</p>
                  </div>
                </div>
              )}
              
              {/* No Active Menu State */}
              {!menuLoading && !hasActiveMenu && (
                <div className="col-span-6 flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                    <p className="text-amber-600 font-medium mb-2">No Active Menu Set</p>
                    <p className="text-sm text-muted-foreground mb-4">Set an active menu to display products</p>
                    <Button 
                      onClick={() => router.push('/modules/menu')}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Set Active Menu
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Products Error State */}
              {menuError && (
                <div className="col-span-6 flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium mb-2">Failed to load active menu</p>
                    <p className="text-sm text-muted-foreground">Please try again or check your connection</p>
                  </div>
                </div>
              )}
              
              {/* Show products from selected category, or categories if no category selected */}
              {!menuLoading && !menuError && hasActiveMenu && selectedCat && selectedCat !== 'favorites' && filteredProducts && filteredProducts.length > 0 && filteredProducts.map(p => {
                const isAdding = addingProductId === p.id
                
                return (
                  <Card 
                    key={p.id} 
                    className={`cursor-pointer transition-all duration-300 overflow-hidden relative aspect-square ${
                      isAdding 
                        ? 'shadow-xl border-green-500 scale-105 animate-pulse bg-green-50' 
                        : 'hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] hover:bg-muted/20'
                    }`}
                    onClick={() => !isAdding && addItem(p)}
                  >
                    {/* Loading overlay */}
                    {isAdding && (
                      <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center z-20">
                        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    
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
                      {p.price && (
                        <p className="text-sm font-semibold text-primary text-center">
                          {p.is_open_price ? 'Open price' : `${p.price?.toFixed(2)} DKK`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Show categories when no specific category is selected */}
              {!menuLoading && !menuError && hasActiveMenu && (!selectedCat || selectedCat === 'favorites') && cats && cats.length > 0 && (
                <div className="col-span-6 text-center py-8 mb-8">
                  <h3 className="text-lg font-medium mb-6">Choose a Category</h3>
                  <div className="grid grid-cols-6 gap-4 max-w-4xl mx-auto">
                    {cats.map(category => (
                      <Button
                        key={category.id}
                        variant="outline"
                        size="lg"
                        className="h-24 flex-col gap-3 text-sm p-4 hover:shadow-lg transition-all duration-200"
                        onClick={() => setSelectedCat(category.id)}
                      >
                        {/* Category Display - Uses database values, no hardcoding */}
                        {category.display_style === 'image' && category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : category.display_style === 'color' && category.color ? (
                          <div 
                            className="w-12 h-12 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                        ) : category.emoji ? (
                          <span className="text-3xl">{category.emoji}</span>
                        ) : (
                          <span className="text-3xl text-muted-foreground">📁</span>
                        )}
                        <span className="text-center leading-tight font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {prods.filter(p => p.category_id === category.id).length} products
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show message when no products are available */}
                {!menuLoading && !menuError && hasActiveMenu && selectedCat && selectedCat !== 'favorites' && filteredProducts && filteredProducts.length === 0 && (
                <div className="col-span-6 text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-lg font-medium mb-2">No products available</p>
                  <p className="text-sm">
                    This category has no products in the active menu
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground/70">
                    Add products to this category in Menu Management
                  </p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/modules/menu')}
                      variant="outline"
                      size="sm"
                    >
                      Go to Menu Management
                    </Button>
                  </div>
                </div>
              )}
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
            
            {/* Categories Loading State */}
            {menuLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading active menu...</span>
              </div>
            )}
            
            {/* Categories Error State */}
            {menuError && (
              <div className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Failed to load active menu</span>
              </div>
            )}
            
            {/* Categories List */}
            {!menuLoading && !menuError && hasActiveMenu && cats && cats.map(c => (
              <Button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                variant={selectedCat === c.id ? "default" : "ghost"}
                size="lg"
                className="rounded-full px-6 py-3 h-12 text-base font-medium flex items-center gap-2"
                style={c.color ? { 
                  backgroundColor: selectedCat === c.id ? c.color : 'transparent',
                  borderColor: c.color,
                  color: selectedCat === c.id ? 'white' : c.color
                } : {}}
              >
                {c.emoji && <span>{c.emoji}</span>}
                {c.name}
              </Button>
            ))}
            
            {/* No Categories Message */}
            {!menuLoading && !menuError && hasActiveMenu && cats && cats.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No categories in active menu</p>
                <p className="text-xs">Add categories to your active menu in Menu Management</p>
                <Button 
                  onClick={() => router.push('/modules/menu')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Go to Menu Management
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Order Basket */}
      <div className="w-80 bg-card border-l flex flex-col min-h-screen max-h-screen overflow-hidden">
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

        <div className="flex-1 p-6 overflow-y-auto min-h-0">
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
                      {items.filter(item => item.course_no === servingNum).map((item, idx) => {
                        const isJustAdded = justAddedItemId === item.id
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                              isJustAdded 
                                ? 'bg-green-100 border border-green-300 shadow-md' 
                                : 'hover:bg-muted/50'
                            }`}
                            style={isJustAdded ? {
                              animation: 'gentle-highlight 0.6s ease-out'
                            } : {}}
                            onClick={() => handleBasketItemClick(item)}
                          >
                            {/* Just added indicator - positioned relative to avoid layout shift */}
                            {isJustAdded && (
                              <div className="w-3 h-3 mr-2 relative flex-shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute top-0.5 left-0.5"></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full absolute top-0.5 left-0.5"></div>
                              </div>
                            )}
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
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Order Actions - Always Visible */}
        <div className="sticky bottom-0 p-6 border-t bg-card shadow-lg z-30">
          {items.length > 0 && (
            <>
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
            </>
          )}
          
          {/* Course Management - Always Visible */}
          <div className={`${items.length > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                🍽️ Course Management
              </span>
              <Badge variant="outline" className="text-xs">
                {currentTable?.name || `Table ${tableId}`}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleFireNext} 
                variant="outline" 
                size="sm"
                className="text-xs h-9"
              >
                🔥 Fire Next Course
              </Button>
              <Button 
                onClick={handleFireX} 
                variant="outline" 
                size="sm"
                className="text-xs h-9"
              >
                🎯 Fire Specific Course
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Fire courses for existing orders on this table
            </p>
          </div>
        </div>
      </div>

      {/* Modifier Selector Modal - REMOVED - Products go directly to basket */}

      {/* Basket Item Editor Modal */}
      {showBasketItemEditor && selectedBasketItem && (
        <div className="animate-in fade-in zoom-in duration-300">
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
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
              <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={tableId} // Use tableId as order reference
        totalAmount={total}
        onPaymentComplete={handlePaymentComplete}
      />
      )}
    </div>
  )
}
