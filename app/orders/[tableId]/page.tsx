'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function OrderPage() {
  const { tableId } = useParams() as { tableId: string }
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string|undefined>()
  const [items, setItems] = useState<NewOrderItem[]>([])
  const { data: cats } = useCategories()
  const { data: prods } = useProductsByCategory(selectedCat)
  const createOrder = useCreateOrder()
  const fireCourse = useFireCourse()
  const fireNext = useFireNextCourse()

  useEffect(() => { 
    if (!selectedCat && cats?.length) setSelectedCat(cats[0].id) 
  }, [cats, selectedCat])
  
  const total = useMemo(() => items.reduce((s,i)=> s + (i.unit_price ?? 0) * i.qty, 0), [items])

  const addItem = (p: { id: string; name: string; price: number; is_open_price: boolean }) => {
    const price = p.is_open_price ? Number(prompt('Pris?') || '0') : p.price
    const course = Number(prompt('Kursus (1=forret,2=hovedret,3=dessert)?') || '1')
    setItems(prev => [...prev, { product_id: p.id, qty: 1, unit_price: price, course_no: course }])
  }
  
  const placeOrder = async () => {
    const id = await createOrder.mutateAsync({ type: 'dine_in', table_id: tableId, items })
    alert('Ordre oprettet: ' + id)
  }
  
  const handleFireNext = async () => {
    const orderId = prompt('Order ID at fire next course for:'); if (!orderId) return
    const next = await fireNext.mutateAsync(orderId); alert(next ? `Kørte ret ${next}` : 'Ingen ret at køre')
  }
  
  const handleFireX = async () => {
    const orderId = prompt('Order ID:'); const x = Number(prompt('Ret nr.:')); if (!orderId || !x) return
    await fireCourse.mutateAsync({ order_id: orderId, course_no: x }); alert('Kørte ret ' + x)
  }

  // Product image mapping (placeholder images)
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
              <span className="font-semibold text-lg">Table {tableId}</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {prods?.map(p => (
              <Card 
                key={p.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden hover:border-primary/50"
                onClick={() => addItem(p)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img 
                    src={getProductImage(p.name)} 
                    alt={p.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm mb-1">{p.name}</h3>
                  <p className="text-sm font-semibold">
                    {p.is_open_price ? 'Open price' : `${p.price?.toFixed(2)} DKK`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Category Filters */}
        <div className="bg-card border-t px-6 py-4">
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setSelectedCat(undefined)}
              variant={!selectedCat ? "default" : "ghost"}
              size="sm"
              className="rounded-full px-4"
            >
              All
            </Button>
            {cats?.map(c => (
              <Button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                variant={selectedCat === c.id ? "default" : "ghost"}
                size="sm"
                className="rounded-full px-4"
              >
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
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items in basket</p>
              <p className="text-sm mt-1">Select items from menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {item.qty}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">Product #{item.product_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Course #{item.course_no}</p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {(item.unit_price ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-muted/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold">{total.toFixed(2)} DKK</span>
            </div>
            
            <Button 
              onClick={placeOrder} 
              className="w-full h-12 font-semibold"
            >
              Send order
            </Button>
            
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
    </div>
  )
}
