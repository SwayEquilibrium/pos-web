'use client'

import { useState } from 'react'
import { flags } from '@/src/config/flags'
import { useOrderPrintingIntegration, OrderForPrinting } from '@/proposals/hooks/usePrinterIntegration.v1'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OrderPrintTestPage() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [tableNumber, setTableNumber] = useState('5')
  
  const { handleOrderCreated, isEnabled } = useOrderPrintingIntegration()

  // Feature flag check
  if (!flags.printerWebPRNTV1) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>🖨️ Order Print Test - Disabled</CardTitle>
            <CardDescription>
              The printer WebPRNT feature is currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To enable order printing:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add <code>printerWebPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code> environment variable</li>
                <li>Set <code>NEXT_PUBLIC_PRINTER_URL</code> to your printer&apos;s WebPRNT endpoint</li>
                <li>Restart your development server</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleTestOrder = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Create a sample order with different categories
      const testOrder: OrderForPrinting = {
        id: `test-${Date.now()}`,
        type: 'dine_in',
        table_id: tableNumber,
        order_number: `T${tableNumber}-${Date.now().toString().slice(-4)}`,
        items: [
          {
            product_id: 'test-food-1',
            qty: 2,
            unit_price: 125.00,
            product_name: 'Grilled Chicken Sandwich',
            category_name: 'Food',
            modifiers: [
              { name: 'No mayo' },
              { name: 'Extra pickles' }
            ]
          },
          {
            product_id: 'test-food-2',
            qty: 1,
            unit_price: 45.00,
            product_name: 'French Fries',
            category_name: 'Food',
            modifiers: [
              { name: 'Extra crispy' }
            ]
          },
          {
            product_id: 'test-drink-1',
            qty: 2,
            unit_price: 35.00,
            product_name: 'Coca Cola',
            category_name: 'Drinks'
          },
          {
            product_id: 'test-drink-2',
            qty: 1,
            unit_price: 45.00,
            product_name: 'Fresh Orange Juice',
            category_name: 'Beverages'
          }
        ]
      }

      console.log('🍽️ Testing order printing with order:', testOrder)

      await handleOrderCreated(testOrder)
      
      setMessage(`✅ Test order printed successfully!\n🖨️ Kitchen receipt sent for Table ${tableNumber}`)
    } catch (error) {
      console.error('❌ Test order printing failed:', error)
      setMessage(`❌ Test order printing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTakeawayTest = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Create a sample takeaway order
      const takeawayOrder: OrderForPrinting = {
        id: `takeaway-${Date.now()}`,
        type: 'takeaway',
        order_number: `TO-${Date.now().toString().slice(-4)}`,
        customer_name: 'John Doe',
        items: [
          {
            product_id: 'test-pizza-1',
            qty: 1,
            unit_price: 189.00,
            product_name: 'Margherita Pizza',
            category_name: 'Food',
            modifiers: [
              { name: 'Extra cheese' },
              { name: 'Thin crust' }
            ]
          },
          {
            product_id: 'test-drink-3',
            qty: 2,
            unit_price: 25.00,
            product_name: 'Sparkling Water',
            category_name: 'Drinks'
          }
        ]
      }

      console.log('🥡 Testing takeaway order printing:', takeawayOrder)

      await handleOrderCreated(takeawayOrder)
      
      setMessage(`✅ Takeaway order printed successfully!\n🖨️ Kitchen receipt sent for ${takeawayOrder.customer_name}`)
    } catch (error) {
      console.error('❌ Takeaway order printing failed:', error)
      setMessage(`❌ Takeaway order printing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🖨️ Order Print Test</CardTitle>
          <CardDescription>
            Test automatic printing when orders are created
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className={`p-4 rounded-lg ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span>{isEnabled ? '✅' : '❌'}</span>
              <span className="font-medium">
                Printer Integration: {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {isEnabled && (
              <div className="text-sm text-green-600 mt-1">
                Kitchen receipts will be printed automatically
              </div>
            )}
          </div>

          {/* Table Number */}
          <div className="space-y-2">
            <Label htmlFor="table-number">Table Number</Label>
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
              onClick={handleTestOrder} 
              disabled={loading || !isEnabled}
              className="w-full"
            >
              {loading ? 'Printing...' : `Test Dine-In Order (Table ${tableNumber})`}
            </Button>
            
            <Button 
              onClick={handleTakeawayTest} 
              disabled={loading || !isEnabled}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Printing...' : 'Test Takeaway Order'}
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

          {/* Sample Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Sample Order Contents:</h3>
            <div className="space-y-2">
              <div><strong>Dine-In Order:</strong></div>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>2x Grilled Chicken Sandwich (No mayo, Extra pickles)</li>
                <li>1x French Fries (Extra crispy)</li>
                <li>2x Coca Cola</li>
                <li>1x Fresh Orange Juice</li>
              </ul>
              
              <div className="mt-3"><strong>Takeaway Order:</strong></div>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>1x Margherita Pizza (Extra cheese, Thin crust)</li>
                <li>2x Sparkling Water</li>
                <li>Customer: John Doe</li>
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Expected Results:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Kitchen receipt should print with order details</li>
              <li>No prices shown on kitchen receipts</li>
              <li>Modifiers and special instructions included</li>
              <li>Table number or customer name displayed</li>
              <li>Paper should cut after printing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
