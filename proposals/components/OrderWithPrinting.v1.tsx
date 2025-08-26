/**
 * Enhanced Order Component with Printing Integration v1.0
 * 
 * Wraps the existing order creation with automatic printing functionality.
 * This can be used to replace or enhance the existing order pages.
 */

'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'
import { useOrderPrintingIntegration, OrderForPrinting } from '@/proposals/hooks/usePrinterIntegration.v1'
import { flags } from '@/src/config/flags'

export default function OrderPageWithPrinting() {
  const { tableId } = useParams() as { tableId: string }
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string | undefined>()
  const [items, setItems] = useState<NewOrderItem[]>([])
  const { data: cats } = useCategories()
  const { data: prods } = useProductsByCategory(selectedCat)
  const createOrder = useCreateOrder()
  const fireCourse = useFireCourse()
  const fireNext = useFireNextCourse()
  
  // Printer integration
  const { handleOrderCreated, isEnabled: printerEnabled } = useOrderPrintingIntegration()

  useEffect(() => { 
    if (!selectedCat && cats?.length) setSelectedCat(cats[0].id) 
  }, [cats, selectedCat])
  
  const total = useMemo(() => 
    items.reduce((s, i) => s + (i.unit_price ?? 0) * i.qty, 0), [items]
  )

  const addItem = (p: any) => {
    const price = p.is_open_price ? Number(prompt('Pris?') || '0') : p.price
    const course = Number(prompt('Kursus (1=forret,2=hovedret,3=dessert)?') || '1')
    
    // Find category name for the product
    const category = cats?.find(c => c.id === p.category_id)
    
    setItems(prev => [...prev, { 
      product_id: p.id, 
      qty: 1, 
      unit_price: price, 
      course_no: course,
      product_name: p.name,
      category_name: category?.name
    }])
  }

  const placeOrder = async () => {
    try {
      console.log('🍽️ Creating order with items:', items)
      
      // Create the order using existing hook
      const orderId = await createOrder.mutateAsync({ 
        type: 'dine_in', 
        table_id: tableId, 
        items 
      })
      
      console.log('✅ Order created with ID:', orderId)
      
      // If printer is enabled, print the order
      if (printerEnabled && flags.printerWebPRNTV1) {
        console.log('🖨️ Sending order to printer...')
        
        // Create order data for printing
        const orderForPrinting: OrderForPrinting = {
          id: orderId,
          type: 'dine_in',
          table_id: tableId,
          order_number: `T${tableId}-${Date.now().toString().slice(-4)}`, // Simple order number
          items: items.map(item => {
            const product = prods?.find(p => p.id === item.product_id)
            const category = cats?.find(c => c.id === product?.category_id)
            
            return {
              product_id: item.product_id,
              qty: item.qty,
              unit_price: item.unit_price || 0,
              kitchen_note: item.kitchen_note,
              course_no: item.course_no,
              product_name: product?.name || 'Unknown Product',
              category_name: category?.name || 'Unknown Category',
              modifiers: item.modifiers || []
            }
          })
        }
        
        // Print the order
        await handleOrderCreated(orderForPrinting)
        
        alert(`✅ Order created: ${orderId}\n🖨️ Kitchen receipt sent to printer!`)
      } else {
        alert('✅ Order created: ' + orderId)
      }
      
      // Clear items after successful order
      setItems([])
      
    } catch (error) {
      console.error('❌ Order creation failed:', error)
      alert('❌ Order creation failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleFireNext = async () => {
    const orderId = prompt('Order ID at fire next course for:')
    if (!orderId) return
    const next = await fireNext.mutateAsync(orderId)
    alert(next ? `Kørte ret ${next}` : 'Ingen ret at køre')
  }

  const handleFireX = async () => {
    const orderId = prompt('Order ID:')
    const x = Number(prompt('Ret nr.:'))
    if (!orderId || !x) return
    await fireCourse.mutateAsync({ order_id: orderId, course_no: x })
    alert('Kørte ret ' + x)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Printer Status */}
      {flags.printerWebPRNTV1 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600">🖨️</span>
            <span className="text-sm font-medium text-green-800">
              Printer Integration Active
            </span>
            <span className="text-xs text-green-600">
              Kitchen receipts will print automatically
            </span>
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Order for Table {tableId}</h1>
        <div className="text-sm text-gray-600">
          Total: {total} DKK | Items: {items.length}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {cats?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-lg border ${
                selectedCat === cat.id 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {prods?.map(prod => (
            <button
              key={prod.id}
              onClick={() => addItem(prod)}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="font-medium">{prod.name}</div>
              <div className="text-sm text-gray-600">{prod.price} DKK</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Items */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Current Order</h3>
        {items.length === 0 ? (
          <div className="text-gray-500 italic">No items added yet</div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const product = prods?.find(p => p.id === item.product_id)
              return (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{product?.name || 'Unknown'}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Course {item.course_no} | Qty: {item.qty}
                    </span>
                  </div>
                  <div className="font-medium">
                    {(item.unit_price || 0) * item.qty} DKK
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={placeOrder}
          disabled={items.length === 0 || createOrder.isPending}
          className={`px-6 py-3 rounded-lg font-medium ${
            items.length === 0 || createOrder.isPending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {createOrder.isPending ? 'Creating Order...' : `Place Order (${total} DKK)`}
          {printerEnabled && ' + Print'}
        </button>

        <button
          onClick={handleFireNext}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Fire Next Course
        </button>

        <button
          onClick={handleFireX}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Fire Specific Course
        </button>

        <button
          onClick={() => setItems([])}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Clear Order
        </button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <div><strong>Debug Info:</strong></div>
          <div>Printer Enabled: {printerEnabled ? 'Yes' : 'No'}</div>
          <div>Feature Flag: {flags.printerWebPRNTV1 ? 'Active' : 'Inactive'}</div>
          <div>Printer URL: {process.env.NEXT_PUBLIC_PRINTER_URL || 'Not set'}</div>
          <div>Items Count: {items.length}</div>
        </div>
      )}
    </div>
  )
}
