'use client'

import { useState, useEffect } from 'react'
import { flags } from '@/src/config/flags'
import { starWebPRNTProvider } from '@/proposals/ext/modkit/printers/providers/StarWebPRNT.v1'
import { buildTestReceipt, buildBasicReceipt, ReceiptItem } from '@/proposals/ext/modkit/printers/receipts/basicReceipt.v1'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PrintTestPage() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [printerUrl, setPrinterUrl] = useState(
    process.env.NEXT_PUBLIC_PRINTER_URL || 'http://192.168.8.197/StarWebPRNT/SendMessage'
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Feature flag check
  if (!flags.printerWebPRNTV1) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>🖨️ Printer Test - Disabled</CardTitle>
            <CardDescription>
              The printer WebPRNT feature is currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To enable printer testing:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add <code>printerWebPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code> environment variable</li>
                <li>Set <code>NEXT_PUBLIC_PRINTER_URL</code> to your printer&apos;s WebPRNT endpoint</li>
                <li>Ensure the Star WebPRNT SDK files are in <code>public/vendor/webprnt/</code></li>
                <li>Restart your development server</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium">Example .env.local:</p>
                <pre className="mt-2">
{`NEXT_PUBLIC_FLAGS=printerWebPRNTV1
NEXT_PUBLIC_PRINTER_URL=http://192.168.1.100/StarWebPRNT/SendMessage`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleTestPrint = async () => {
    setLoading(true)
    setMessage('')

    try {
      console.log('Testing printer at:', printerUrl)
      const testLines = buildTestReceipt(48)
      console.log('Test lines:', testLines)
      await starWebPRNTProvider.printReceipt(testLines, { url: printerUrl })
      setMessage('✅ Test print successful! Check your printer.')
    } catch (error) {
      console.error('Print test error:', error)
      setMessage(`❌ Test print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSampleReceipt = async () => {
    setLoading(true)
    setMessage('')

    try {
      const sampleItems: ReceiptItem[] = [
        { name: 'Espresso', quantity: 2, price: 3.50, productType: 'drinks' },
        { name: 'Croissant', quantity: 1, price: 4.25, productType: 'food', modifiers: ['Extra butter'] },
        { name: 'Cappuccino', quantity: 1, price: 4.75, productType: 'drinks', modifiers: ['Extra shot', 'Oat milk'] }
      ]

      const receiptLines = buildBasicReceipt(sampleItems, {
        type: 'customer',
        orderReference: 'Table 5',
        footerText: 'Thank you for visiting!',
        paperWidth: 48
      })

      await starWebPRNTProvider.printReceipt(receiptLines, { url: printerUrl })
      setMessage('✅ Sample receipt printed successfully!')
    } catch (error) {
      setMessage(`❌ Sample receipt failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleKitchenReceipt = async () => {
    setLoading(true)
    setMessage('')

    try {
      const kitchenItems: ReceiptItem[] = [
        { name: 'Grilled Chicken Sandwich', quantity: 1, price: 12.50, productType: 'food', modifiers: ['No mayo', 'Extra pickles'] },
        { name: 'French Fries', quantity: 1, price: 4.50, productType: 'food', modifiers: ['Extra crispy'] },
        { name: 'Coca Cola', quantity: 2, price: 2.75, productType: 'drinks' }
      ]

      // Filter only food items for kitchen
      const foodItems = kitchenItems.filter(item => item.productType === 'food')
      
      const kitchenLines = buildBasicReceipt(foodItems, {
        type: 'kitchen',
        orderReference: 'Table 3',
        headerText: 'KITCHEN ORDER - FOOD',
        paperWidth: 48,
        showPricesOnKitchen: false
      })

      await starWebPRNTProvider.printReceipt(kitchenLines, { url: printerUrl })
      setMessage('✅ Kitchen receipt printed successfully!')
    } catch (error) {
      setMessage(`❌ Kitchen receipt failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionTest = async () => {
    setLoading(true)
    setMessage('')

    try {
      // First check if SDK files are available
      const builderScript = document.querySelector('script[src="/vendor/webprnt/StarWebPrintBuilder.js"]')
      const traderScript = document.querySelector('script[src="/vendor/webprnt/StarWebPrintTrader.js"]')
      console.log('SDK Scripts loaded:', { builder: !!builderScript, trader: !!traderScript })
      console.log('Window objects:', { 
        builder: !!(window as any).StarWebPrintBuilder, 
        trader: !!(window as any).StarWebPrintTrader 
      })

      const isConnected = await starWebPRNTProvider.testConnection({ url: printerUrl })
      if (isConnected) {
        setMessage('✅ Printer connection successful!')
      } else {
        setMessage('❌ Printer connection failed.')
      }
    } catch (error) {
      console.error('Connection test error:', error)
      setMessage(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🖨️ Star WebPRNT Printer Test</CardTitle>
          <CardDescription>
            Test your Star mC-Print2 printer connection and print samples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Printer URL Configuration */}
          <div className="space-y-2">
            <Label htmlFor="printer-url">Printer URL</Label>
            <Input
              id="printer-url"
              value={printerUrl}
              onChange={(e) => setPrinterUrl(e.target.value)}
              placeholder="http://192.168.8.197/StarWebPRNT/SendMessage"
            />
            <p className="text-sm text-muted-foreground">
              Enter your printer&apos;s IP address. Format: http://[IP]/StarWebPRNT/SendMessage
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleConnectionTest} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                try {
                  const response = await fetch(printerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request: '' })
                  })
                  const text = await response.text()
                  console.log('Direct fetch response:', text)
                  setMessage(response.ok ? '✅ Direct connection OK' : '❌ Direct connection failed')
                } catch (error) {
                  console.error('Direct fetch error:', error)
                  setMessage(`❌ Direct fetch failed: ${error}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Direct Test'}
            </Button>
            
            <Button 
              onClick={handleTestPrint} 
              disabled={loading}
            >
              {loading ? 'Printing...' : 'Simple Test Print'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  // Send a more substantial test print
                  const testLines = [
                    '================================',
                    '        PRINTER TEST',
                    '================================',
                    '',
                    'Date: ' + (mounted ? new Date().toLocaleDateString() : ''),
                    'Time: ' + (mounted ? new Date().toLocaleTimeString() : ''),
                    '',
                    'This is a test print to verify',
                    'your Star mC-Print2 printer is',
                    'working correctly.',
                    '',
                    '1. Paper should feed',
                    '2. Text should be printed',
                    '3. Paper should cut',
                    '',
                    'If you can read this, your',
                    'printer is working!',
                    '',
                    '================================',
                    '       TEST COMPLETE',
                    '================================',
                    ''
                  ]
                  
                  await starWebPRNTProvider.printReceipt(testLines, { 
                    url: printerUrl,
                    autoCut: true 
                  })
                  setMessage('✅ Extended test print sent! Check your printer.')
                } catch (error) {
                  console.error('Extended test error:', error)
                  setMessage(`❌ Extended test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Printing...' : 'Extended Test'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  // Try raw Star WebPRNT commands
                  console.log('Sending raw Star WebPRNT test...')
                  
                  // Load SDK if not already loaded
                  await starWebPRNTProvider.printReceipt(['Loading SDK...'], { url: printerUrl })
                  
                  // @ts-ignore
                  const builder = new (window as any).StarWebPrintBuilder()
                  
                  // More explicit initialization
                  builder.createInitializationElement({ reset: true })
                  
                  // Add substantial content with explicit formatting
                  builder.createTextElement({ 
                    data: '\n*** STAR PRINTER TEST ***\n\n',
                    emphasis: true,
                    alignment: 'center'
                  })
                  
                  builder.createTextElement({ 
                    data: 'This is a direct test using\nStar WebPRNT builder.\n\n'
                  })
                  
                  builder.createTextElement({ 
                    data: 'Time: ' + (mounted ? new Date().toLocaleString() : '') + '\n\n'
                  })
                  
                  builder.createTextElement({ 
                    data: 'If you see this text,\nyour printer is working!\n\n'
                  })
                  
                  // Force paper feed and cut
                  builder.createFeedElement({ line: 2 })
                  builder.createCutPaperElement({ type: 'partial', feed: true })
                  
                  // @ts-ignore
                  const trader = new (window as any).StarWebPrintTrader({ url: printerUrl })
                  
                  const request = builder.toString()
                  console.log('Raw request:', request)
                  
                  await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000)
                    
                    trader.onReceive = (response: any) => {
                      clearTimeout(timeout)
                      console.log('Raw test response:', response)
                      resolve()
                    }
                    
                    trader.onError = (error: any) => {
                      clearTimeout(timeout)
                      console.error('Raw test error:', error)
                      reject(error)
                    }
                    
                    trader.sendMessage({ request })
                  })
                  
                  setMessage('✅ Raw test sent! Check your printer.')
                } catch (error) {
                  console.error('Raw test error:', error)
                  setMessage(`❌ Raw test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Raw Test'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  console.log('Sending FORCE PRINT test...')
                  
                  // @ts-ignore
                  const builder = new (window as any).StarWebPrintBuilder()
                  
                  // Force printer wake up
                  builder.createInitializationElement({ reset: true, type: 'initialize' })
                  
                  // Add multiple lines of substantial text
                  const lines = [
                    '================================',
                    '       FORCE PRINT TEST',
                    '================================',
                    '',
                    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
                    'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
                    '',
                    'This should definitely print!',
                    'Multiple lines of text here.',
                    'Testing 123 456 789',
                    'HELLO WORLD FROM PRINTER',
                    '',
                    '================================',
                    '    END OF FORCE TEST',
                    '================================'
                  ]
                  
                  // Add each line with emphasis
                  lines.forEach((line, index) => {
                    builder.createTextElement({ 
                      data: line + '\n',
                      emphasis: index < 3 || index > lines.length - 4, // Emphasize headers
                      invert: false,
                      underline: false,
                      alignment: 'left'
                    })
                  })
                  
                  // Add extra spacing
                  builder.createTextElement({ data: '\n\n\n' })
                  
                  // Force multiple feeds and cut
                  builder.createFeedElement({ line: 5 })
                  builder.createCutPaperElement({ type: 'partial', feed: true })
                  
                  // @ts-ignore
                  const trader = new (window as any).StarWebPrintTrader({ url: printerUrl })
                  
                  const request = builder.toString()
                  console.log('Force print request length:', request.length)
                  console.log('Force print request:', request.substring(0, 500) + '...')
                  
                  await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000)
                    
                    trader.onReceive = (response: any) => {
                      clearTimeout(timeout)
                      console.log('Force print response:', response)
                      resolve()
                    }
                    
                    trader.onError = (error: any) => {
                      clearTimeout(timeout)
                      console.error('Force print error:', error)
                      reject(error)
                    }
                    
                    trader.sendMessage({ request })
                  })
                  
                  setMessage('✅ Force print sent! This should definitely print something.')
                } catch (error) {
                  console.error('Force print error:', error)
                  setMessage(`❌ Force print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="default"
            >
              {loading ? 'Force Printing...' : 'FORCE PRINT'}
            </Button>
            
            <Button 
              onClick={handleSampleReceipt} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Printing...' : 'Sample Receipt'}
            </Button>
            
            <Button 
              onClick={handleKitchenReceipt} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Printing...' : 'Kitchen Receipt'}
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Setup Instructions */}
          <div className="bg-muted p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ensure your Star mC-Print2 is connected to the same network</li>
              <li>Find the printer&apos;s IP address (print self-test page)</li>
              <li>Update the printer URL above</li>
              <li>Make sure the Star WebPRNT SDK files are in public/vendor/webprnt/</li>
              <li>Click &quot;Test Connection&quot; to verify connectivity</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2 text-yellow-800">If printer responds but doesn&apos;t print:</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li><strong>Check paper:</strong> Ensure thermal paper is loaded correctly</li>
              <li><strong>Check printer status:</strong> Look for error lights (red LED)</li>
              <li><strong>Try Extended Test:</strong> More content may trigger paper feed</li>
              <li><strong>Check cover:</strong> Printer cover must be closed properly</li>
              <li><strong>Power cycle:</strong> Turn printer off/on if it seems stuck</li>
            </ul>
          </div>

          {/* SDK Status */}
          <div className="text-xs text-muted-foreground">
            <p>Required SDK files:</p>
            <ul className="list-disc list-inside ml-2">
              <li>public/vendor/webprnt/StarWebPrintBuilder.js</li>
              <li>public/vendor/webprnt/StarWebPrintTrader.js</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
