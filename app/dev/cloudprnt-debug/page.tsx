'use client'

import { useState } from 'react'
import { flags } from '@/src/config/flags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CloudPRNTDebugPage() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testAPI = async () => {
    addResult('🔍 Testing CloudPRNT API...')
    
    // Test 1: Check feature flag
    addResult(`Feature Flag: printerCloudPRNTV1 = ${flags.printerCloudPRNTV1}`)
    addResult(`Environment: NEXT_PUBLIC_FLAGS = ${process.env.NEXT_PUBLIC_FLAGS || 'undefined'}`)
    
    // Test 2: Try to reach the enqueue endpoint
    try {
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId: 'test-printer',
          payload: 'Test message'
        }),
      })

      addResult(`Response status: ${response.status}`)
      addResult(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
      
      const responseText = await response.text()
      addResult(`Response body (first 300 chars): ${responseText.substring(0, 300)}`)

      if (responseText.startsWith('<!DOCTYPE') || responseText.includes('<html>')) {
        addResult('❌ ERROR: Received HTML instead of JSON - API route not found or not working')
      } else {
        try {
          const json = JSON.parse(responseText)
          addResult(`✅ Valid JSON response: ${JSON.stringify(json)}`)
        } catch (e) {
          addResult(`❌ Invalid JSON: ${e}`)
        }
      }

    } catch (error) {
      addResult(`❌ Network error: ${error}`)
    }

    // Test 3: Check if we can reach the status endpoint
    try {
      const statusResponse = await fetch('/api/cloudprnt/enqueue?printerId=test')
      addResult(`Status endpoint: ${statusResponse.status}`)
      const statusText = await statusResponse.text()
      addResult(`Status response: ${statusText.substring(0, 200)}`)
    } catch (error) {
      addResult(`❌ Status endpoint error: ${error}`)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 CloudPRNT API Debug</CardTitle>
          <CardDescription>
            Debug CloudPRNT API endpoints and feature flags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium">Feature Flag</h3>
              <div className="text-sm">
                <div>printerCloudPRNTV1: <span className={flags.printerCloudPRNTV1 ? 'text-green-600' : 'text-red-600'}>
                  {flags.printerCloudPRNTV1 ? 'TRUE' : 'FALSE'}
                </span></div>
                <div>Environment: {process.env.NEXT_PUBLIC_FLAGS || 'undefined'}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium">Expected URLs</h3>
              <div className="text-xs">
                <div>POST /api/cloudprnt/enqueue</div>
                <div>GET /api/cloudprnt/enqueue</div>
                <div>GET /api/cloudprnt/[id]/job</div>
              </div>
            </div>
          </div>

          <Button onClick={testAPI} className="w-full">
            🔍 Run API Tests
          </Button>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white">Test Results:</h3>
                <Button 
                  onClick={() => setResults([])} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-800"
                >
                  Clear
                </Button>
              </div>
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}

          {/* Fix Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">If API is not working:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Enable feature flag:</strong> Add <code>printerCloudPRNTV1</code> to <code>NEXT_PUBLIC_FLAGS</code> in <code>.env.local</code></li>
              <li><strong>Restart dev server:</strong> Stop and run <code>npm run dev</code> again</li>
              <li><strong>Check environment:</strong> Make sure <code>.env.local</code> has the flag</li>
              <li><strong>Run database migration:</strong> Execute the SQL from <code>proposals/migrations/010_cloudprnt.sql</code></li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current .env.local should contain:</h3>
            <pre className="text-sm bg-white p-2 rounded border">
{`NEXT_PUBLIC_FLAGS=printerWebPRNTV1,printerCloudPRNTV1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
