'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrinterPhysicalTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testNetworkConnection = async () => {
    setLoading(true)
    addResult('🔍 Testing network connection to 192.168.8.197...')

    try {
      const response = await fetch('http://192.168.8.197', { 
        method: 'GET',
        mode: 'no-cors', // Avoid CORS issues
        signal: AbortSignal.timeout(5000)
      })
      addResult('✅ Network connection successful - printer is reachable')
    } catch (error) {
      addResult(`❌ Network connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testBasicWebPRNT = async () => {
    setLoading(true)
    addResult('🖨️ Testing basic WebPRNT endpoint...')

    try {
      const response = await fetch('http://192.168.8.197', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'request=',
        signal: AbortSignal.timeout(10000)
      })

      const text = await response.text()
      addResult(`✅ WebPRNT endpoint responded: ${response.status} ${response.statusText}`)
      
      if (text) {
        addResult(`📄 Response content: ${text.substring(0, 200)}...`)
      }
    } catch (error) {
      addResult(`❌ WebPRNT test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testMinimalPrint = async () => {
    setLoading(true)
    addResult('🖨️ Sending minimal print command...')

    try {
      // Create the simplest possible Star WebPRNT request
      const printData = `<?xml version="1.0" encoding="UTF-8"?>
<StarWebPrint xmlns="http://www.star-m.jp/xml/StarWebPrint">
  <Request>
    <Command>
      <Initialize reset="true"/>
      <Text emphasis="true">*** MINIMAL TEST ***</Text>
      <Text>
PRINTER TEST
Time: ${new Date().toLocaleString()}
IP: 192.168.8.197

This is a minimal test.
If you see this, your printer works!

*** END TEST ***
      </Text>
      <FeedLine line="5"/>
      <CutPaper type="partial" feed="true"/>
    </Command>
  </Request>
</StarWebPrint>`

      const response = await fetch('http://192.168.8.197', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: `request=${encodeURIComponent(printData)}`,
        signal: AbortSignal.timeout(15000)
      })

      const responseText = await response.text()
      addResult(`✅ Minimal print sent - Status: ${response.status}`)
      addResult(`📄 Printer response: ${responseText.substring(0, 300)}...`)

      if (responseText.includes('success>true') || responseText.includes('Success')) {
        addResult('🎉 SUCCESS! Check your printer for output!')
      } else {
        addResult('⚠️ Print command sent but response unclear - check printer')
      }

    } catch (error) {
      addResult(`❌ Minimal print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 TSP100 Physical Test Suite</CardTitle>
          <CardDescription>
            Step-by-step testing to diagnose your printer issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testNetworkConnection} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : '1. Network Test'}
            </Button>
            
            <Button 
              onClick={testBasicWebPRNT} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : '2. WebPRNT Test'}
            </Button>
            
            <Button 
              onClick={testMinimalPrint} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Printing...' : '3. PRINT TEST'}
            </Button>
          </div>

          {/* Clear Results */}
          {testResults.length > 0 && (
            <Button onClick={clearResults} variant="ghost" size="sm">
              Clear Results
            </Button>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <h3 className="text-white mb-2">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}

          {/* Manual Tests */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Manual Tests (Do These First):</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Power Test:</strong> Is the printer power LED on?</li>
              <li><strong>Paper Test:</strong> Press the FEED button - does paper advance?</li>
              <li><strong>Paper Type:</strong> Are you using thermal paper (shiny side DOWN)?</li>
              <li><strong>Cover Test:</strong> Is the printer cover closed tightly?</li>
              <li><strong>Network Test:</strong> Can you visit http://192.168.8.197 in your browser?</li>
            </ol>
          </div>

          {/* Printer Settings */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Check Printer Web Settings:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open http://192.168.8.197 in your browser</li>
              <li>Look for "WebPRNT" settings</li>
              <li>Ensure "Enable WebPRNT" is checked</li>
              <li>Check print density (should be 70-100%)</li>
              <li>Verify paper width setting matches your paper</li>
            </ol>
          </div>

          {/* Expected Results */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">What Should Happen:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Network Test:</strong> Should succeed if printer is connected</li>
              <li><strong>WebPRNT Test:</strong> Should return XML response</li>
              <li><strong>Print Test:</strong> Should print "MINIMAL TEST" with timestamp</li>
              <li><strong>Physical Output:</strong> Paper should advance and cut</li>
              <li><strong>Text Output:</strong> Black text should appear on thermal paper</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
