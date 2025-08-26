'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DirectPrintTest() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const directPrintTest = async () => {
    setLoading(true)
    setMessage('Testing direct print to TSP100...')

    try {
      // Load the Star WebPRNT SDK
      await loadScript('/vendor/webprnt/StarWebPrintBuilder.js')
      await loadScript('/vendor/webprnt/StarWebPrintTrader.js')

      console.log('✅ SDK loaded successfully')

      // Create a very simple print request
      const builder = new (window as any).StarWebPrintBuilder()
      
      // Add initialization
      builder.createInitializationElement({ reset: true, type: 'initialize' })
      
      // Add large, bold text
      builder.createTextElement({
        data: '*** TSP100 TEST ***\n',
        emphasis: true,
        alignment: 'center'
      })
      
      builder.createTextElement({
        data: '\n=== PRINTER WORKING ===\n\n',
        emphasis: true
      })
      
      builder.createTextElement({
        data: `Time: ${mounted ? new Date().toLocaleString() : 'Loading...'}\n`,
        emphasis: false
      })
      
      builder.createTextElement({
        data: 'IP: 192.168.8.197\n',
        emphasis: false
      })
      
      builder.createTextElement({
        data: 'Model: Star TSP100\n\n',
        emphasis: false
      })
      
      // Add multiple lines to force output
      for (let i = 1; i <= 5; i++) {
        builder.createTextElement({
          data: `Test Line ${i}\n`,
          emphasis: i % 2 === 0
        })
      }
      
      builder.createTextElement({
        data: '\n*** SUCCESS! ***\n\n',
        emphasis: true,
        alignment: 'center'
      })
      
      // Force paper feed
      builder.createFeedElement({ line: 5 })
      
      // Cut the paper
      builder.createCutPaperElement({ type: 'partial', feed: true })

      // Create the request
      const request = builder.createSendRequest('http://192.168.8.197', 10000)

      console.log('📄 Print request created, sending to printer...')

      // Send to printer
      const trader = new (window as any).StarWebPrintTrader({ url: 'http://192.168.8.197' })
      
      await new Promise<void>((resolve, reject) => {
        trader.onReceive = function(response: any) {
          console.log('🖨️ Printer response:', response)
          
          if (response.tradeResult === 'Success' || 
              response.tradeSuccess === 'true' ||
              response.success === true ||
              (typeof response === 'string' && response.includes('success>true'))) {
            setMessage(`✅ DIRECT PRINT SUCCESS!\n\n🖨️ Your TSP100 should be printing now!\n\nResponse: ${JSON.stringify(response, null, 2)}`)
            resolve()
          } else {
            setMessage(`⚠️ Print sent but response unclear:\n\n${JSON.stringify(response, null, 2)}`)
            resolve() // Don't reject, just report
          }
        }
        
        trader.onError = function(error: any) {
          console.error('❌ Printer error:', error)
          setMessage(`❌ Print failed: ${JSON.stringify(error, null, 2)}`)
          reject(error)
        }
        
        trader.sendMessage({ request })
      })

    } catch (error) {
      console.error('❌ Direct print test failed:', error)
      setMessage(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Helper to load scripts
  async function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.body.appendChild(script)
    })
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🖨️ Direct TSP100 Print Test</CardTitle>
          <CardDescription>
            Direct communication with your TSP100 printer - no database, no complex logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Printer Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Printer Configuration:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Model:</strong> Star TSP100</li>
              <li><strong>IP Address:</strong> 192.168.8.197</li>
              <li><strong>Connection:</strong> Ethernet/LAN</li>
              <li><strong>Protocol:</strong> Star WebPRNT</li>
            </ul>
          </div>

          {/* Test Button */}
          <Button 
            onClick={directPrintTest} 
            disabled={loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? 'Testing Printer...' : '🖨️ DIRECT PRINT TEST'}
          </Button>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-line font-mono ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : message.includes('⚠️')
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">What This Test Does:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Loads Star WebPRNT SDK directly</li>
              <li>Creates a simple test receipt with large text</li>
              <li>Sends directly to http://192.168.8.197</li>
              <li>Forces paper feed and cut</li>
              <li>Shows raw printer response</li>
            </ul>
            
            <h3 className="font-medium mb-2 mt-4">Expected Results:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Paper should advance and cut</li>
              <li>Large bold text should print: "TSP100 TEST"</li>
              <li>Multiple test lines should appear</li>
              <li>Success message should show</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <h3 className="font-medium mb-2">If Nothing Prints:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Check paper:</strong> Thermal paper, thermal side DOWN</li>
              <li><strong>Check power:</strong> Printer fully powered on</li>
              <li><strong>Check network:</strong> Ping 192.168.8.197</li>
              <li><strong>Check cover:</strong> Printer cover closed tightly</li>
              <li><strong>Check settings:</strong> Visit http://192.168.8.197 in browser</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
