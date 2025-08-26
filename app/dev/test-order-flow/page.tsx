'use client'

import { useState, useEffect } from 'react'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, NewOrderItem } from '@/hooks/useOrders'

export default function TestOrderFlowPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [orderItems, setOrderItems] = useState<NewOrderItem[]>([])
  
  const { data: rooms } = useRooms()
  const { data: tables } = useTables()
  const { data: categories } = useCategories()
  const { data: products } = useProductsByCategory(selectedCategory)
  const createOrder = useCreateOrder()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (rooms?.length && !selectedRoom) {
      setSelectedRoom(rooms[0].id)
    }
  }, [rooms, selectedRoom])

  useEffect(() => {
    if (categories?.length && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  const filteredTables = tables?.filter(table => table.room_id === selectedRoom) || []

  const addProduct = (product: any) => {
    const newItem: NewOrderItem = {
      product_id: product.id,
      qty: 1,
      unit_price: product.price,
      course_no: 1,
      kitchen_note: '',
      sort_bucket: 0,
      modifiers: []
    }
    setOrderItems(prev => [...prev, newItem])
  }

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const placeOrder = async () => {
    if (!selectedTable) {
      alert('Please select a table first!')
      return
    }

    if (orderItems.length === 0) {
      alert('Please add some items to the order!')
      return
    }

    try {
      const orderId = await createOrder.mutateAsync({
        type: 'dine_in',
        table_id: selectedTable,
        items: orderItems
      })
      
      alert(`✅ Order created successfully: ${orderId}\n\nCheck the terminal logs and your printer for the kitchen receipt!`)
      setOrderItems([]) // Clear the order
      
    } catch (error) {
      alert(`❌ Order failed: ${error}`)
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test Table → Order → Print Flow
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Creation */}
          <div className="space-y-6">
            {/* Room Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">1️⃣ Select Room</h2>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {rooms?.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">2️⃣ Select Table</h2>
              <div className="grid grid-cols-3 gap-2">
                {filteredTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table.id)}
                    className={`p-3 rounded border-2 transition-colors ${
                      selectedTable === table.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {table.name}
                  </button>
                ))}
              </div>
              {filteredTables.length === 0 && (
                <p className="text-gray-500">No tables in selected room</p>
              )}
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">3️⃣ Add Products</h2>
              
              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {products?.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        ${(product.price / 100).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => addProduct(product)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {products?.length === 0 && (
                  <p className="text-gray-500">No products in this category</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Order Summary</h2>
              
              {selectedTable && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <strong>Table:</strong> {filteredTables.find(t => t.id === selectedTable)?.name}
                </div>
              )}

              <div className="space-y-2 mb-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <div className="font-medium">Product {item.product_id.slice(0, 8)}...</div>
                      <div className="text-sm text-gray-500">
                        Qty: {item.qty} × ${(item.unit_price / 100).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {orderItems.length === 0 && (
                  <p className="text-gray-500">No items added</p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold mb-4">
                  <span>Total:</span>
                  <span>
                    ${(orderItems.reduce((sum, item) => sum + (item.unit_price * item.qty), 0) / 100).toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={placeOrder}
                  disabled={!selectedTable || orderItems.length === 0 || createOrder.isPending}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {createOrder.isPending ? 'Creating Order...' : 'Place Order & Print Receipt'}
                </button>
              </div>
            </div>

            {/* Expected Flow */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-4">
                🔄 Expected Flow
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Select room and table</li>
                <li>Add products to order</li>
                <li>Click "Place Order & Print Receipt"</li>
                <li><strong>Order created in database</strong></li>
                <li><strong>Kitchen receipt automatically sent to printer</strong></li>
                <li><strong>TSP100 should physically print the receipt</strong></li>
              </ol>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
              <div className="text-sm space-y-1">
                <div>Rooms loaded: {rooms?.length || 0}</div>
                <div>Tables in room: {filteredTables.length}</div>
                <div>Categories loaded: {categories?.length || 0}</div>
                <div>Products in category: {products?.length || 0}</div>
                <div>Items in order: {orderItems.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
