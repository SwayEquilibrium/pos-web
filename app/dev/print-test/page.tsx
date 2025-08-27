'use client'

import { useState, useEffect } from 'react'
import { flags as envFlags } from '@/src/config/flags'
import { mergeFlags, useDynamicFlags } from '@/proposals/glue/dynamicFlags.v1'
import { DynamicFlagToggler } from '@/proposals/components/DynamicFlagToggler.v1'
import { starWebPRNTProvider } from '@/proposals/ext/modkit/printers/providers/StarWebPRNT.v1'
import { buildTestReceipt, buildBasicReceipt, ReceiptItem, BusinessInfo } from '@/proposals/ext/modkit/printers/receipts/basicReceipt.v1'
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

  // Use dynamic flags that can be toggled without server restart
  const flags = useDynamicFlags(envFlags)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Feature flag check - Check for CloudPRNT first, then WebPRNT
  if (!flags.printerCloudPRNTV1 && !flags.printerWebPRNTV1) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>🖨️ Printer Test - Disabled</CardTitle>
            <CardDescription>
              Both printer features (CloudPRNT and WebPRNT) are currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To enable printer testing:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add <code>printerCloudPRNTV1</code> or <code>printerWebPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code> environment variable</li>
                <li>CloudPRNT: No additional setup needed (uses your existing working printer)</li>
                <li>WebPRNT: Set <code>NEXT_PUBLIC_PRINTER_URL</code> and ensure SDK files are in <code>public/vendor/webprnt/</code></li>
                <li>Restart your development server</li>
              </ol>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium">Example .env.local:</p>
                <pre className="mt-2">
{`NEXT_PUBLIC_FLAGS=printerCloudPRNTV1
# CloudPRNT uses your existing printer setup - no URL needed`}
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
      if (flags.printerCloudPRNTV1) {
        // Use CloudPRNT (same as working orders)
        console.log('Testing CloudPRNT printer...')
        
        const ESC = String.fromCharCode(27)
                            const GS = String.fromCharCode(29)   // Group separator
                    const testContent = [
                      ESC + '@',  // Initialize printer (same as working system)
                      '\n*** PRINTER TEST ***\n\n',
                      'Date: ' + new Date().toLocaleDateString() + '\n',
                      'Time: ' + new Date().toLocaleTimeString() + '\n',
                      '\n',
                      'This is a test print to verify\n',
                      'your Star printer is working.\n',
                      '\n',
                      'If you can read this, your\n',
                      'printer is working correctly!\n',
                      '\n',
                      '--- TEST COMPLETE ---\n',
                      '\n\n\n',  // Extra line feeds before cut
                      ESC + 'd' + String.fromCharCode(1) // ESC d 1 - WORKING partial cut command!
                    ].join('')

        const response = await fetch('/api/cloudprnt/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerId: 'tsp100-kitchen', // Same printer ID as working orders
            payload: testContent,
            contentType: 'application/vnd.star.starprnt',
            receiptType: 'test-print'
          })
        })

        if (response.ok) {
          const result = await response.json()
          setMessage('✅ CloudPRNT test successful! Job ID: ' + result.jobId)
        } else {
          const error = await response.text()
          setMessage('❌ CloudPRNT test failed: ' + error)
        }
      } else if (flags.printerWebPRNTV1) {
        // Use WebPRNT (requires SDK)
        console.log('Testing WebPRNT printer at:', printerUrl)
        const testLines = buildTestReceipt(48)
        await starWebPRNTProvider.printReceipt(testLines, { 
          url: printerUrl,
          cutMethod: 'escpos',
          cutType: 'partial'
        })
        setMessage('✅ WebPRNT test successful! Check your printer.')
      }
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

                        await starWebPRNTProvider.printReceipt(receiptLines, { 
                    url: printerUrl,
                    cutMethod: 'escpos', // Use ESC/POS 1B 6D command
                    cutType: 'partial'
                  })
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

                        await starWebPRNTProvider.printReceipt(kitchenLines, { 
                    url: printerUrl,
                    cutMethod: 'escpos', // Use ESC/POS 1B 6D command
                    cutType: 'partial'
                  })
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Dynamic Flag Toggler */}
      <DynamicFlagToggler className="max-w-2xl mx-auto" />
      
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

          {/* Debug Button */}
          <div className="mb-4 flex gap-2">
            <Button 
              onClick={() => {
                const dynamicOverrides = typeof window !== 'undefined' ? 
                  JSON.parse(localStorage.getItem('pos-dynamic-flags-v1') || '{}') : {}
                
                console.log('=== FLAG DEBUG INFO ===')
                console.log('Environment flags:', envFlags)
                console.log('Dynamic overrides:', dynamicOverrides)
                console.log('Final merged flags:', flags)
                console.log('CloudPRNT enabled:', flags.printerCloudPRNTV1)
                console.log('WebPRNT enabled:', flags.printerWebPRNTV1)
                
                setMessage(`🔍 Flag Debug Info (check console):
Environment CloudPRNT: ${envFlags.printerCloudPRNTV1 ? 'ON' : 'OFF'}
Dynamic Overrides: ${JSON.stringify(dynamicOverrides)}
Final CloudPRNT: ${flags.printerCloudPRNTV1 ? 'ON' : 'OFF'}

${!flags.printerCloudPRNTV1 ? '⚠️ CloudPRNT is disabled! Check Dynamic Flags toggle above.' : '✅ CloudPRNT is enabled'}`)
              }}
              variant="outline"
              size="sm"
            >
              🔍 Debug Flags
            </Button>
            
            <Button 
              onClick={async () => {
                setMessage('🔍 Checking printer configuration...')
                try {
                  // Check if there are any print jobs in the queue
                  const queueResponse = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
                  if (queueResponse.ok) {
                    const queueData = await queueResponse.json()
                    console.log('Print queue data:', queueData)
                    
                    setMessage(`🔍 Printer Queue Info:
Recent Jobs: ${queueData.jobs?.length || 0}
Summary: ${JSON.stringify(queueData.summary || {}, null, 2)}

Check console for full details.

💡 Possible cut issues:
1. Printer hardware settings disable cuts
2. CloudPRNT config strips cut commands  
3. Cut commands need different format
4. Printer needs firmware update`)
                  } else {
                    setMessage('❌ Could not fetch printer queue info')
                  }
                } catch (error) {
                  console.error('Queue check error:', error)
                  setMessage(`❌ Queue check failed: ${error}`)
                }
              }}
              variant="outline"
              size="sm"
            >
              🔍 Check Queue
            </Button>
          </div>

          {/* Printer Investigation */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-sm mb-4">
            <h3 className="font-medium mb-2 text-orange-800">🔍 Investigation Notes:</h3>
            <div className="text-orange-700 space-y-1">
              <div>• <strong>Prints fine:</strong> ✅ Content and formatting work</div>
              <div>• <strong>No cut:</strong> ❌ Cut commands are being ignored</div>
              <div>• <strong>Self-test cuts:</strong> ✅ Printer hardware can cut</div>
              <div>• <strong>Multiple cuts:</strong> When using printer's own interface</div>
            </div>
            <p className="mt-2 text-orange-600 font-medium">
              This suggests the cut commands aren't reaching the printer or are in wrong format.
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
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  console.log('Testing ALL Star cut commands...')
                  
                  if (flags.printerCloudPRNTV1) {
                    // Use CloudPRNT with ESC/POS commands
                    const ESC = String.fromCharCode(27)
                    const GS = String.fromCharCode(29)
                    const LF = String.fromCharCode(10)
                    
                    const testContent = [
                      ESC + '@',  // Initialize printer
                      '\n*** COMPREHENSIVE CUT TEST ***\n\n',
                      'Testing ALL Star cut commands:\n\n',
                      
                      '1. GS V 66 0 (current method)\n',
                      '2. GS V 1 0 (alternative)\n', 
                      '3. ESC d 1 (partial cut)\n',
                      '4. ESC d 3 (feed + partial)\n\n',
                      
                      'Time: ' + new Date().toLocaleString() + '\n\n',
                      'Multiple cuts will be attempted...\n',
                      '\n--- CUT ATTEMPT 1 ---\n',
                      LF + LF,  // Paper feed
                      
                      // Method 1: GS V 66 0 (what we've been using)
                      GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0),
                      
                      '\n--- CUT ATTEMPT 2 ---\n',
                      LF + LF,  // Paper feed
                      
                      // Method 2: GS V 1 0 (alternative partial cut)
                      GS + 'V' + String.fromCharCode(1) + String.fromCharCode(0),
                      
                      '\n--- CUT ATTEMPT 3 ---\n',
                      LF + LF,  // Paper feed
                      
                      // Method 3: ESC d 1 (partial cut)
                      ESC + 'd' + String.fromCharCode(1),
                      
                      '\n--- CUT ATTEMPT 4 ---\n',
                      LF + LF,  // Paper feed
                      
                      // Method 4: ESC d 3 (feed + partial cut)
                      ESC + 'd' + String.fromCharCode(3),
                      
                      '\n--- CUT ATTEMPT 5 ---\n',
                      LF + LF,  // Paper feed
                      
                      // Method 5: Raw hex commands
                      String.fromCharCode(0x1D, 0x56, 0x01, 0x00), // 1D 56 01 00
                      
                      '\nIf ANY of these worked, paper should be cut!\n'
                    ].join('')

                    const response = await fetch('/api/cloudprnt/enqueue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerId: 'tsp100-kitchen',
                        payload: testContent,
                        contentType: 'application/vnd.star.starprnt',
                        receiptType: 'comprehensive-cut-test'
                      })
                    })

                    if (response.ok) {
                      const result = await response.json()
                      setMessage('✅ Comprehensive cut test sent! Job ID: ' + result.jobId + '\n\n🔍 This tests 5 different cut commands:\n1. GS V 66 0\n2. GS V 1 0\n3. ESC d 1\n4. ESC d 3\n5. Raw hex 1D 56 01 00\n\nCheck if ANY of these cut the paper!')
                    } else {
                      const error = await response.text()
                      setMessage('❌ Comprehensive cut test failed: ' + error)
                    }
                  } else {
                    setMessage('❌ CloudPRNT not enabled. This test requires printerCloudPRNTV1 flag.')
                  }
                } catch (error) {
                  console.error('Comprehensive cut test error:', error)
                  setMessage(`❌ Comprehensive cut test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="default"
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Testing...' : '🔍 Test ALL Cut Commands'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  if (flags.printerCloudPRNTV1) {
                    // Use CloudPRNT with ESC/POS
                    const ESC = String.fromCharCode(27)
                    const GS = String.fromCharCode(29)
                    const customerReceipt = [
                      ESC + '@',  // Initialize printer
                      '\n',
                      '      THE COFFEE SHOP\n',
                      '   123 Main Street, City\n',
                      '    Tel: (555) 123-4567\n',
                      '  info@coffeeshop.com\n',
                      '  Tax ID: TAX123456789\n',
                      '\n',
                      '--------------------------------\n',
                      '            RECEIPT\n',
                      '--------------------------------\n',
                      'Order: Table 7\n',
                      'Date: ' + new Date().toLocaleDateString() + '\n',
                      'Time: ' + new Date().toLocaleTimeString() + '\n',
                      '--------------------------------\n',
                      '\n',
                      '2x Americano              $9.00\n',
                      '1x Blueberry Muffin       $3.25\n',
                      '1x Latte                  $5.75\n',
                      '  + Extra shot\n',
                      '  + Oat milk\n',
                      '\n',
                      '--------------------------------\n',
                      'SUBTOTAL:                $18.00\n',
                      'TOTAL:                   $18.00\n',
                      '\n',
                      'Payment: Cash\n',
                      'Amount Paid:             $20.00\n',
                      'Change:                   $2.00\n',
                      '\n',
                      'Thank you for your order!\n',
                      'Please come again!\n',
                      '\n\n\n',
                      ESC + 'd' + String.fromCharCode(1) // ESC d 1 - WORKING partial cut command!
                    ].join('')

                    const response = await fetch('/api/cloudprnt/enqueue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerId: 'tsp100-kitchen',
                        payload: customerReceipt,
                        contentType: 'application/vnd.star.starprnt',
                        receiptType: 'customer-receipt-test'
                      })
                    })

                    if (response.ok) {
                      const result = await response.json()
                      setMessage('✅ Customer receipt sent! Job ID: ' + result.jobId + '\n\nCheck for business info and payment details.')
                    } else {
                      const error = await response.text()
                      setMessage('❌ Customer receipt failed: ' + error)
                    }
                  } else {
                    setMessage('❌ CloudPRNT not enabled. This test requires printerCloudPRNTV1 flag.')
                  }
                } catch (error) {
                  setMessage(`❌ Customer receipt failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Printing...' : '🧾 Customer Receipt'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  if (flags.printerCloudPRNTV1) {
                    // Use CloudPRNT with ESC/POS
                    const ESC = String.fromCharCode(27)
                    const GS = String.fromCharCode(29)
                    const kitchenOrder = [
                      ESC + '@',  // Initialize printer
                      '\n',
                      '--------------------------------\n',
                      '      KITCHEN ORDER - FOOD\n',
                      '--------------------------------\n',
                      'Order: Takeaway #142\n',
                      'Customer: John Smith\n',
                      'Date: ' + new Date().toLocaleDateString() + '\n',
                      'Time: ' + new Date().toLocaleTimeString() + '\n',
                      'Type: KITCHEN COPY\n',
                      '--------------------------------\n',
                      '\n',
                      '1x Grilled Chicken Wrap\n',
                      '  + No onions\n',
                      '  + Extra sauce\n',
                      '  [FOOD]\n',
                      '\n',
                      '1x Caesar Salad\n',
                      '  + Dressing on side\n',
                      '  [FOOD]\n',
                      '\n',
                      '*** DRINKS FILTERED OUT ***\n',
                      '(Orange Juice not shown - kitchen only needs food items)\n',
                      '\n',
                      '--------------------------------\n',
                      'FOOD ITEMS ONLY - NO PRICES\n',
                      '--------------------------------\n',
                      '\n\n\n',
                      ESC + 'd' + String.fromCharCode(1) // ESC d 1 - WORKING partial cut command!
                    ].join('')

                    const response = await fetch('/api/cloudprnt/enqueue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerId: 'tsp100-kitchen',
                        payload: kitchenOrder,
                        contentType: 'application/vnd.star.starprnt',
                        receiptType: 'kitchen-order-test'
                      })
                    })

                    if (response.ok) {
                      const result = await response.json()
                      setMessage('✅ Kitchen order sent! Job ID: ' + result.jobId + '\n\nShould show only food items with modifiers, no prices.')
                    } else {
                      const error = await response.text()
                      setMessage('❌ Kitchen order failed: ' + error)
                    }
                  } else {
                    setMessage('❌ CloudPRNT not enabled. This test requires printerCloudPRNTV1 flag.')
                  }
                } catch (error) {
                  setMessage(`❌ Kitchen order failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Printing...' : '👨‍🍳 Kitchen Order'}
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true)
                setMessage('')
                try {
                  if (flags.printerCloudPRNTV1) {
                    // Use CloudPRNT with ESC/POS - DUAL PRINT
                    const ESC = String.fromCharCode(27)
                    const GS = String.fromCharCode(29)
                    
                    // Combined customer receipt + kitchen order with partial cuts
                    const dualReceipt = [
                      ESC + '@',  // Initialize printer
                      
                      // === CUSTOMER RECEIPT ===
                      '\n',
                      '    BELLA VISTA RESTAURANT\n',
                      '   456 Oak Avenue, Downtown\n',
                      '    Tel: (555) 987-6543\n',
                      '   Tax ID: TAX987654321\n',
                      '\n',
                      '--------------------------------\n',
                      '            RECEIPT\n',
                      '--------------------------------\n',
                      'Order: Table 12\n',
                      'Date: ' + new Date().toLocaleDateString() + '\n',
                      'Time: ' + new Date().toLocaleTimeString() + '\n',
                      '--------------------------------\n',
                      '\n',
                      '1x Margherita Pizza      $16.50\n',
                      '  + Extra cheese\n',
                      '1x Caesar Salad           $8.75\n',
                      '2x Coca Cola              $6.50\n',
                      '1x Garlic Bread           $5.50\n',
                      '  + Extra garlic\n',
                      '\n',
                      '--------------------------------\n',
                      'SUBTOTAL:                $37.25\n',
                      'Tip:                      $5.00\n',
                      'TOTAL:                   $42.25\n',
                      '\n',
                      'Payment: Credit Card\n',
                      'Amount Paid:             $42.25\n',
                      '\n',
                      'Thank you for your order!\n',
                      'Please come again!\n',
                      '\n\n',
                      
                      // PARTIAL CUT after customer receipt (WORKING METHOD!)
                      ESC + 'd' + String.fromCharCode(1), // ESC d 1 - WORKING partial cut!
                      
                      // === KITCHEN ORDER ===
                      '\n\n',
                      '--------------------------------\n',
                      '         KITCHEN ORDER\n',
                      '--------------------------------\n',
                      'Order: Table 12\n',
                      'Date: ' + new Date().toLocaleDateString() + '\n',
                      'Time: ' + new Date().toLocaleTimeString() + '\n',
                      'Type: KITCHEN COPY\n',
                      '--------------------------------\n',
                      '\n',
                      '1x Margherita Pizza\n',
                      '  + Extra cheese\n',
                      '  [FOOD]\n',
                      '\n',
                      '1x Caesar Salad\n',
                      '  [FOOD]\n',
                      '\n',
                      '1x Garlic Bread\n',
                      '  + Extra garlic\n',
                      '  [FOOD]\n',
                      '\n',
                      '*** DRINKS NOT SHOWN ***\n',
                      '(Kitchen orders food only)\n',
                      '\n\n',
                      
                      // FINAL PARTIAL CUT after kitchen order (WORKING METHOD!)
                      ESC + 'd' + String.fromCharCode(1) // ESC d 1 - WORKING partial cut!
                    ].join('')

                    const response = await fetch('/api/cloudprnt/enqueue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        printerId: 'tsp100-kitchen',
                        payload: dualReceipt,
                        contentType: 'application/vnd.star.starprnt',
                        receiptType: 'dual-receipt-test'
                      })
                    })

                    if (response.ok) {
                      const result = await response.json()
                      setMessage('✅ DUAL receipt sent! Job ID: ' + result.jobId + '\n\nShould have: Customer Receipt → Partial Cut → Kitchen Order → Partial Cut')
                    } else {
                      const error = await response.text()
                      setMessage('❌ Dual receipt failed: ' + error)
                    }
                  } else {
                    setMessage('❌ CloudPRNT not enabled. This test requires printerCloudPRNTV1 flag.')
                  }
                } catch (error) {
                  setMessage(`❌ Dual receipt failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
                setLoading(false)
              }}
              disabled={loading}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Printing...' : '🎯 DUAL Print Test'}
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

          {/* Flag Status */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2 text-blue-800">🚀 Current Flag Status:</h3>
            <div className="grid grid-cols-2 gap-2 text-blue-700">
              <div>CloudPRNT: <span className={flags.printerCloudPRNTV1 ? 'text-green-600 font-bold' : 'text-red-600'}>{flags.printerCloudPRNTV1 ? 'ENABLED ✅' : 'DISABLED ❌'}</span></div>
              <div>WebPRNT: <span className={flags.printerWebPRNTV1 ? 'text-green-600 font-bold' : 'text-red-600'}>{flags.printerWebPRNTV1 ? 'ENABLED ✅' : 'DISABLED ❌'}</span></div>
            </div>
            <p className="mt-2 text-blue-600">
              {flags.printerCloudPRNTV1 ? 
                '✅ Using CloudPRNT (same as your working orders)' : 
                '⚠️ CloudPRNT disabled - check Dynamic Flags toggle above'
              }
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-muted p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>CloudPRNT (Recommended):</strong> Just enable the flag - uses your existing printer setup</li>
              <li><strong>WebPRNT:</strong> Set printer URL and ensure SDK files are in public/vendor/webprnt/</li>
              <li>Check the flag status above - if CloudPRNT is disabled, toggle it in Dynamic Flags</li>
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
