'use client'

import { useState, useEffect } from 'react'
import { buildESCPOSReceipt, ReceiptItem } from '@/proposals/ext/modkit/printers/receipts/escposReceipt.v1'

export default function TestStructuredReceiptPage() {
  const [mounted, setMounted] = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendStructuredReceipt = async () => {
    setTestResult('🧪 Sending structured receipt with category ordering...')
    
    try {
      // Create test items in random order (as they might be entered)
      const testItems: ReceiptItem[] = [
        // Dessert (should print last)
        {
          name: 'Chocolate Cake',
          quantity: 1,
          price: 850, // $8.50 in cents
          modifiers: ['Extra whipped cream'],
          categoryName: 'Desserter',
          categoryId: 'cat-desserts'
        },
        
        // Main course (should print second)
        {
          name: 'Grilled Salmon',
          quantity: 1,
          price: 2400, // $24.00
          modifiers: ['Medium rare', 'No sauce'],
          categoryName: 'Fisk',
          categoryId: 'cat-fish'
        },
        
        // Beverage (should print last)
        {
          name: 'House Red Wine',
          quantity: 2,
          price: 1200, // $12.00 each
          modifiers: [],
          categoryName: 'Vin',
          categoryId: 'cat-wine'
        },
        
        // Appetizer (should print first)
        {
          name: 'Caesar Salad',
          quantity: 1,
          price: 1150, // $11.50
          modifiers: ['Extra parmesan', 'No croutons'],
          categoryName: 'Forretter',
          categoryId: 'cat-appetizers'
        },
        
        // Another main course (should be grouped with other mains)
        {
          name: 'Beef Steak',
          quantity: 1,
          price: 2800, // $28.00
          modifiers: ['Medium', 'With mushroom sauce'],
          categoryName: 'Kød',
          categoryId: 'cat-meat'
        },
        
        // Side dish
        {
          name: 'French Fries',
          quantity: 2,
          price: 650, // $6.50 each
          modifiers: [],
          categoryName: 'Tilbehør',
          categoryId: 'cat-sides'
        }
      ]

      // Build structured receipt
      const structuredReceipt = buildESCPOSReceipt(testItems, {
        type: 'kitchen',
        orderReference: 'Table 5',
        headerText: undefined,
        showPricesOnKitchen: false
      })

      // Send to printer
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: structuredReceipt,
          contentType: 'application/vnd.star.starprnt',
          orderId: null,
          receiptType: 'structured-test'
        })
      })

      if (response.ok) {
        setTestResult(`✅ Structured receipt sent! 

Expected print order:
1. FORRETTER (Appetizers)
   - Caesar Salad

2. KØD (Meat) 
   - Beef Steak

3. FISK (Fish)
   - Grilled Salmon

4. TILBEHØR (Sides)
   - French Fries

5. DESSERTER (Desserts)
   - Chocolate Cake

6. VIN (Wine)
   - House Red Wine

Check your printer for the structured output!`)
      } else {
        const errorText = await response.text()
        setTestResult('❌ Failed: ' + response.status + ' - ' + errorText)
      }
    } catch (error) {
      setTestResult('❌ Error: ' + error)
    }
  }

  const sendRandomOrderReceipt = async () => {
    setTestResult('🎲 Sending receipt with items in random order...')
    
    try {
      // Same items but in completely random order
      const randomItems: ReceiptItem[] = [
        {
          name: 'Coffee',
          quantity: 2,
          price: 450,
          categoryName: 'Kaffe',
          categoryId: 'cat-coffee'
        },
        {
          name: 'Ice Cream',
          quantity: 1,
          price: 750,
          categoryName: 'Desserter',
          categoryId: 'cat-desserts'
        },
        {
          name: 'Chicken Wings',
          quantity: 1,
          price: 1300,
          modifiers: ['Spicy', 'Extra sauce'],
          categoryName: 'Forretter',
          categoryId: 'cat-appetizers'
        },
        {
          name: 'Pasta Carbonara',
          quantity: 1,
          price: 1850,
          categoryName: 'Hovedretter',
          categoryId: 'cat-mains'
        }
      ]

      const structuredReceipt = buildESCPOSReceipt(randomItems, {
        type: 'kitchen',
        orderReference: 'Table 12',
        headerText: 'RANDOM ORDER TEST',
        showPricesOnKitchen: false
      })

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: structuredReceipt,
          contentType: 'application/vnd.star.starprnt',
          orderId: null,
          receiptType: 'random-test'
        })
      })

      if (response.ok) {
        setTestResult(`✅ Random order receipt sent!

Items were entered in this order:
1. Coffee (last)
2. Ice Cream (third) 
3. Chicken Wings (first)
4. Pasta Carbonara (second)

But should print in structured order:
1. FORRETTER - Chicken Wings
2. HOVEDRETTER - Pasta Carbonara  
3. DESSERTER - Ice Cream
4. KAFFE - Coffee`)
      } else {
        const errorText = await response.text()
        setTestResult('❌ Failed: ' + response.status + ' - ' + errorText)
      }
    } catch (error) {
      setTestResult('❌ Error: ' + error)
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🗂️ Test Structured Receipt Ordering
        </h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            ✨ Smart Category Ordering
          </h2>
          <div className="text-green-700 space-y-2">
            <div>✅ Items automatically grouped by category</div>
            <div>✅ Categories printed in logical order (appetizers → mains → desserts)</div>
            <div>✅ Category headers in <strong>BOLD + UNDERLINED</strong></div>
            <div>✅ Works regardless of order entry sequence</div>
            <div>✅ Supports Danish and English category names</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🍽️ Full Course Test</h2>
            <p className="text-gray-600 mb-4">
              Tests all category types in proper order with formatting
            </p>
            <button
              onClick={sendStructuredReceipt}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600 font-semibold"
            >
              Send Full Course Receipt
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🎲 Random Order Test</h2>
            <p className="text-gray-600 mb-4">
              Items entered randomly but printed in structured order
            </p>
            <button
              onClick={sendRandomOrderReceipt}
              className="w-full bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600 font-semibold"
            >
              Send Random Order Receipt
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Result</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm min-h-[150px] whitespace-pre-line">
            {testResult || 'Click a test button above to start...'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            📋 Category Order Configuration
          </h2>
          <div className="text-blue-700 space-y-2 text-sm">
            <div><strong>1. Forretter/Appetizers/Starters</strong> (Order: 1)</div>
            <div><strong>2. Hovedretter/Main Courses</strong> (Order: 2)</div>
            <div className="ml-4">• Kød/Meat (2.1)</div>
            <div className="ml-4">• Fisk/Fish (2.2)</div>
            <div className="ml-4">• Vegetar/Vegetarian (2.3)</div>
            <div><strong>2.5. Tilbehør/Sides</strong> (Order: 2.5)</div>
            <div><strong>3. Desserter/Desserts</strong> (Order: 3)</div>
            <div><strong>4. Drikkevarer/Beverages</strong> (Order: 4)</div>
            <div className="ml-4">• Kaffe/Coffee (4.1)</div>
            <div className="ml-4">• Vin/Wine (4.4)</div>
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <strong>Note:</strong> You can customize the category ordering in the ESC/POS receipt builder configuration.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
