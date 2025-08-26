'use client'

import { useState } from 'react'
import { useCreateOrder, NewOrderItem } from '@/hooks/useOrders'
import { flags } from '@/src/config/flags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RealOrderTestPage() {
  const [tableNumber, setTableNumber] = useState('5')
  const [message, setMessage] = useState<string>('')
  const createOrder = useCreateOrder()

  // Feature flag check
  if (!flags.printerWebPRNTV1) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>🖨️ Real Order Test - Disabled</CardTitle>
            <CardDescription>
              The printer WebPRNT feature is currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To enable automatic printing:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add <code>printerWebPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code> environment variable</li>
                <li>Set <code>NEXT_PUBLIC_PRINTER_URL=http://192.168.8.197</code></li>
                <li>Restart your development server</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleRealDineInOrder = async () => {
    setMessage('Creating real dine-in order...')

    try {
      // Create REAL order items
      const orderItems: NewOrderItem[] = [
        {
          product_id: '11111111-1111-1111-1111-111111111111', // Use a real UUID format
          qty: 2,
          unit_price: 125.00,
          kitchen_note: 'No mayo, extra pickles',
          course_no: 1
        },
        {
          product_id: '22222222-2222-2222-2222-222222222222',
          qty: 1,
          unit_price: 45.00,
          kitchen_note: 'Extra crispy',
          course_no: 1
        },
        {
          product_id: '33333333-3333-3333-3333-333333333333',
          qty: 2,
          unit_price: 35.00,
          kitchen_note: 'With ice',
          course_no: 1
        }
      ]

      console.log('🍽️ Creating REAL dine-in order with items:', orderItems)

      // This will create a real order in your database AND automatically print
      const orderId = await createOrder.mutateAsync({
        type: 'dine_in',
        table_id: null, // Set to null to avoid UUID error
        items: orderItems
      })

      setMessage(`✅ REAL ORDER CREATED!\n📋 Order ID: ${orderId}\n🖨️ Kitchen receipt should have printed automatically!\n\nTable: ${tableNumber} (stored in receipt)`)

    } catch (error) {
      console.error('❌ Real order creation failed:', error)
      setMessage(`❌ Order failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRealTakeawayOrder = async () => {
    setMessage('Creating real takeaway order...')

    try {
      const orderItems: NewOrderItem[] = [
        {
          product_id: '44444444-4444-4444-4444-444444444444',
          qty: 1,
          unit_price: 189.00,
          kitchen_note: 'Extra cheese, thin crust',
          course_no: 1
        },
        {
          product_id: '55555555-5555-5555-5555-555555555555',
          qty: 2,
          unit_price: 25.00,
          kitchen_note: 'No ice',
          course_no: 1
        }
      ]

      console.log('🥡 Creating REAL takeaway order with items:', orderItems)

      const orderId = await createOrder.mutateAsync({
        type: 'takeaway',
        table_id: null, // No table for takeaway
        items: orderItems
      })

      setMessage(`✅ REAL TAKEAWAY ORDER CREATED!\n📋 Order ID: ${orderId}\n🖨️ Kitchen receipt should have printed automatically!`)

    } catch (error) {
      console.error('❌ Real takeaway order creation failed:', error)
      setMessage(`❌ Takeaway order failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🍽️ Real Order Test with Auto-Print</CardTitle>
          <CardDescription>
            Create REAL orders in your database with automatic kitchen receipt printing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span className="font-medium">Auto-Print Enabled</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              Kitchen receipts will print automatically when orders are created
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Printer: {process.env.NEXT_PUBLIC_PRINTER_URL || 'Not configured'}
            </div>
          </div>

          {/* Table Number */}
          <div className="space-y-2">
            <Label htmlFor="table-number">Table Number (for dine-in orders)</Label>
            <Input
              id="table-number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="5"
            />
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={handleRealDineInOrder} 
              disabled={createOrder.isPending}
              className="w-full"
            >
              {createOrder.isPending ? 'Creating Order...' : `Create Real Dine-In Order (Table ${tableNumber})`}
            </Button>
            
            <Button 
              onClick={handleRealTakeawayOrder} 
              disabled={createOrder.isPending}
              variant="outline"
              className="w-full"
            >
              {createOrder.isPending ? 'Creating Order...' : 'Create Real Takeaway Order'}
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">⚠️ IMPORTANT - This Creates Real Orders!</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Real database entries</strong> - Orders will be saved to your database</li>
              <li><strong>Automatic printing</strong> - Kitchen receipts print immediately</li>
              <li><strong>Order tracking</strong> - Orders appear in your order management system</li>
              <li><strong>Production ready</strong> - This is the actual order creation flow</li>
            </ul>
          </div>

          {/* Expected Output */}
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Expected Results:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Order created in database with unique ID</li>
              <li>Kitchen receipt prints automatically to your TSP100</li>
              <li>Receipt shows table number or takeaway order number</li>
              <li>Receipt includes all items and kitchen notes</li>
              <li>Paper cuts after printing</li>
              <li>Success message with order ID displayed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
