'use client'
import { useEffect, useMemo, useState } from 'react'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, NewOrderItem } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useRoomsTables'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FavoriteItem {
  id: string
  type: 'category' | 'product'
  name: string
  data: any
  position: number
}

export default function FavoritesPage() {
  const [items, setItems] = useState<NewOrderItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('Table 1')
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [editMode, setEditMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  
  const { data: cats } = useCategories()
  const { data: prods } = useProductsByCategory(selectedCategory)
  const { data: tables } = useTables()
  const createOrder = useCreateOrder()

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

  // Load grid settings
  const [gridSettings, setGridSettings] = useState({
    columns: 4,
    rows: 4,
    buttonSize: 'medium' as const,
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

  const total = useMemo(() => items.reduce((s, i) => s + (i.unit_price ?? 0) * i.qty, 0), [items])

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
    
    // Check if already in favorites
    if (favorites.find(f => f.id === newFavorite.id)) {
      alert('Dette element er allerede i favoritter!')
      return
    }

    saveFavorites([...favorites, newFavorite])
  }

  const removeFromFavorites = (favoriteId: string) => {
    saveFavorites(favorites.filter(f => f.id !== favoriteId))
  }

  const addItem = (product: any) => {
    const price = product.is_open_price ? Number(prompt('Pris?') || '0') : product.price
    setItems(prev => [...prev, { product_id: product.id, qty: 1, unit_price: price, course_no: 1 }])
  }

  const handleCategoryClick = (category: any) => {
    // Check if it has subcategories or products
    if (category.has_children) {
      // Navigate deeper into category hierarchy - this would need to be implemented
      alert('Kategori navigation ikke implementeret endnu i favoritter')
    } else {
      // Show products for this category
      setSelectedCategory(category.id)
    }
  }

  const placeOrder = async () => {
    if (!tables?.length) {
      alert('Ingen borde tilgængelige')
      return
    }

    try {
      const firstTableId = tables[0].id
      const id = await createOrder.mutateAsync({ type: 'dine_in', table_id: firstTableId, items })
      alert('Ordre oprettet: ' + id)
      setItems([])
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Fejl ved oprettelse af ordre: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const getButtonSizeClass = () => {
    switch (gridSettings.buttonSize) {
      case 'small': return 'h-16 text-xs'
      case 'medium': return 'h-20 text-sm'
      case 'large': return 'h-24 text-base'
      default: return 'h-20 text-sm'
    }
  }

  const getProductImage = (productName: string) => {
    const images: { [key: string]: string } = {
      'Caesar Salat': '🥗',
      'Bruschetta': '🍞',
      'Bøf med pommes': '🥩',
      'Pasta Carbonara': '🍝',
      'Tiramisu': '🍰',
    }
    return images[productName] || '🍽️'
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Favorites */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-lg font-semibold">⭐ Favoritter</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {favorites.length} elementer
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? '✅ Færdig' : '✏️ Rediger'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>
                🏠 Hjem
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin'}>
                🏢 Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-xl font-semibold mb-2">Ingen favoritter endnu</h3>
                <p className="text-muted-foreground mb-4">
                  Tilføj dine mest brugte kategorier og produkter til hurtig adgang
                </p>
                <Button onClick={() => setEditMode(true)}>
                  ➕ Tilføj Favoritter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div 
              className={`grid gap-${gridSettings.compactMode ? '2' : '4'}`}
              style={{ 
                gridTemplateColumns: `repeat(${gridSettings.columns}, minmax(0, 1fr))` 
              }}
            >
              {favorites.map(favorite => (
                <div key={favorite.id} className="relative">
                  <Button
                    className={`${getButtonSizeClass()} w-full flex-col gap-1 p-2 relative overflow-hidden ${
                      favorite.type === 'category' 
                        ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' 
                        : 'bg-green-50 hover:bg-green-100 border-green-200'
                    }`}
                    variant="outline"
                    onClick={() => {
                      if (editMode) return
                      if (favorite.type === 'category') {
                        handleCategoryClick(favorite.data)
                      } else {
                        addItem(favorite.data)
                      }
                    }}
                  >
                    {/* Favorite Type Badge */}
                    <Badge 
                      className={`absolute top-1 right-1 text-xs ${
                        favorite.type === 'category' ? 'bg-blue-600' : 'bg-green-600'
                      }`}
                      variant="default"
                    >
                      {favorite.type === 'category' ? '📁' : '🍽️'}
                    </Badge>

                    {gridSettings.showImages && (
                      <span className="text-2xl">
                        {favorite.type === 'category' 
                          ? getCategoryIcon(favorite.name)
                          : getProductImage(favorite.name)
                        }
                      </span>
                    )}
                    <span className="font-medium truncate w-full text-center">
                      {favorite.name}
                    </span>
                    {gridSettings.showPrices && favorite.type === 'product' && favorite.data.price && (
                      <span className="text-primary font-semibold">
                        {favorite.data.is_open_price ? 'Åben pris' : `${favorite.data.price} kr`}
                      </span>
                    )}
                  </Button>

                  {/* Edit Mode - Remove Button */}
                  {editMode && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={() => removeFromFavorites(favorite.id)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add to Favorites Section (Edit Mode) */}
          {editMode && (
            <div className="mt-8 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">📁 Tilføj Kategorier</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cats?.map(category => (
                      <Button
                        key={category.id}
                        variant="outline"
                        size="sm"
                        className="h-12 flex-col gap-1"
                        onClick={() => addToFavorites('category', category)}
                        disabled={favorites.some(f => f.id === `category-${category.id}`)}
                      >
                        <span>{getCategoryIcon(category.name)}</span>
                        <span className="text-xs truncate w-full">{category.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">🍽️ Tilføj Produkter</h3>
                  <div className="mb-4">
                    <select
                      className="px-3 py-2 border rounded-md"
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                    >
                      <option value="">Vælg kategori</option>
                      {cats?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {prods?.map(product => (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        className="h-16 flex-col gap-1 p-2"
                        onClick={() => addToFavorites('product', product)}
                        disabled={favorites.some(f => f.id === `product-${product.id}`)}
                      >
                        <span>{getProductImage(product.name)}</span>
                        <span className="text-xs truncate w-full text-center">{product.name}</span>
                        <span className="text-xs font-semibold text-primary">
                          {product.is_open_price ? 'Åben' : `${product.price} kr`}
                        </span>
                      </Button>
                    ))}
                  </div>
                  {!prods?.length && selectedCategory && (
                    <p className="text-center text-muted-foreground py-4">
                      Ingen produkter i denne kategori
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Order Basket (same as main page) */}
      <div className="w-80 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">🛒 Kurv</span>
            </div>
            <span className="text-2xl font-bold text-primary">{total.toFixed(0)} kr.</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Favorit side - hurtig bestilling
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingen varer i kurven</p>
              <p className="text-sm mt-1">Klik på dine favorit produkter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {item.qty}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">Product #{item.product_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{(item.unit_price ?? 0).toFixed(0)} kr.</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(idx)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t space-y-3">
            <Button 
              onClick={placeOrder} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              🛒 Send bestilling
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
