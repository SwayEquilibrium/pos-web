'use client'

import { useState } from 'react'
import { flags } from '@/src/config/flags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EnvChecker() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const checkEnvironment = async () => {
    setTestResults([])
    addResult('🔍 Checking environment configuration...')

    // Check flags
    addResult(`📋 Feature Flags:`)
    addResult(`   printerWebPRNTV1: ${flags.printerWebPRNTV1}`)
    addResult(`   printerCloudPRNTV1: ${flags.printerCloudPRNTV1}`)
    addResult(`   Raw NEXT_PUBLIC_FLAGS: "${process.env.NEXT_PUBLIC_FLAGS}"`)

    // Check Supabase
    addResult(`🗄️ Supabase Configuration:`)
    addResult(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}`)
    addResult(`   Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`)

    // Test API endpoints
    addResult(`🔗 Testing API Endpoints:`)
    
    try {
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'test',
          payload: 'test'
        })
      })
      
      const result = await response.json()
      addResult(`   CloudPRNT API: ${response.status} - ${result.error || result.message || 'OK'}`)
    } catch (error) {
      addResult(`   CloudPRNT API: Error - ${error}`)
    }

    // Test database connection
    try {
      const response = await fetch('/api/cloudprnt/enqueue?printerId=test')
      const result = await response.json()
      addResult(`   Database: ${response.ok ? 'Connected' : 'Failed'}`)
      if (result.jobs !== undefined) {
        addResult(`   Jobs in queue: ${result.jobs.length}`)
      }
    } catch (error) {
      addResult(`   Database: Error - ${error}`)
    }

    // Network info
    addResult(`🌐 Network Information:`)
    addResult(`   Current host: ${window.location.hostname}`)
    addResult(`   Current port: ${window.location.port}`)
    addResult(`   Full origin: ${window.location.origin}`)
  }

  const testDirectAPI = async () => {
    addResult('🧪 Testing CloudPRNT API directly...')

    try {
      // Test enqueue
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'env-test',
          payload: `Environment Test Job
Time: ${new Date().toLocaleString()}
Test ID: ${Math.random().toString(36).substring(7)}`,
          receiptType: 'env-test'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addResult(`✅ API Test Success: Job ${result.jobId} created`)
        
        // Check if job appears in queue
        setTimeout(async () => {
          try {
            const queueResponse = await fetch('/api/cloudprnt/enqueue?printerId=env-test')
            const queueData = await queueResponse.json()
            const testJobs = queueData.jobs?.filter((j: any) => j.printer_id === 'env-test') || []
            addResult(`📊 Found ${testJobs.length} test jobs in queue`)
          } catch (error) {
            addResult(`❌ Queue check failed: ${error}`)
          }
        }, 1000)
        
      } else {
        addResult(`❌ API Test Failed: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ API Test Error: ${error}`)
    }
  }

  const restartInstructions = () => {
    addResult('🔄 Server Restart Instructions:')
    addResult('1. Stop your development server (Ctrl+C)')
    addResult('2. Run: npm run dev')
    addResult('3. Wait for server to fully start')
    addResult('4. Test CloudPRNT again')
    addResult('')
    addResult('💡 Environment variables are only loaded at server startup!')
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>⚙️ Environment & Configuration Checker</CardTitle>
          <CardDescription>
            Verify your environment variables and API configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium mb-2">Feature Flags Status</h3>
              <div className="text-sm space-y-1">
                <div className={flags.printerCloudPRNTV1 ? 'text-green-600' : 'text-red-600'}>
                  CloudPRNT: {flags.printerCloudPRNTV1 ? '✅ ENABLED' : '❌ DISABLED'}
                </div>
                <div className={flags.printerWebPRNTV1 ? 'text-green-600' : 'text-red-600'}>
                  WebPRNT: {flags.printerWebPRNTV1 ? '✅ ENABLED' : '❌ DISABLED'}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Raw: {process.env.NEXT_PUBLIC_FLAGS || 'undefined'}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-medium mb-2">Expected Configuration</h3>
              <div className="text-xs font-mono bg-white p-2 rounded">
                NEXT_PUBLIC_FLAGS=printerWebPRNTV1,printerCloudPRNTV1
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={checkEnvironment} className="h-16">
              🔍 Check Environment
              <div className="text-xs mt-1">Verify all settings</div>
            </Button>
            
            <Button onClick={testDirectAPI} variant="outline" className="h-16">
              🧪 Test CloudPRNT API
              <div className="text-xs mt-1">Direct API test</div>
            </Button>
            
            <Button onClick={restartInstructions} variant="outline" className="h-16">
              🔄 Restart Instructions
              <div className="text-xs mt-1">How to restart server</div>
            </Button>
          </div>

          {/* Results */}
          {testResults.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white">Test Results:</h3>
                <Button 
                  onClick={() => setTestResults([])} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-800"
                >
                  Clear
                </Button>
              </div>
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}

          {/* Your Current .env.local */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">Your Current .env.local:</h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://wncxwhcscvqxkenllzsw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Printer Configuration  
NEXT_PUBLIC_PRINTER_URL=http://192.168.8.197

# Feature Flags
NEXT_PUBLIC_FLAGS=printerWebPRNTV1,printerCloudPRNTV1

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
            </pre>
            <div className="text-xs text-gray-600 mt-2">
              ✅ This looks correct! CloudPRNT flag is present.
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🚨 If CloudPRNT Still Shows as DISABLED:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Restart development server:</strong> Stop (Ctrl+C) and run <code>npm run dev</code></li>
              <li><strong>Clear browser cache:</strong> Hard refresh (Ctrl+Shift+R)</li>
              <li><strong>Check file location:</strong> Make sure <code>.env.local</code> is in project root</li>
              <li><strong>Check file name:</strong> Must be exactly <code>.env.local</code> (not .txt)</li>
              <li><strong>No spaces around equals:</strong> <code>FLAGS=value</code> not <code>FLAGS = value</code></li>
            </ol>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">✅ If Environment is Correct:</h3>
            <p className="text-sm">
              Your .env.local looks good! The issue is likely in the printer configuration.
              Make sure your TSP100 is using the correct server URL:
            </p>
            <div className="bg-white p-2 rounded mt-2 font-mono text-xs">
              http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job
            </div>
            <p className="text-xs text-gray-600 mt-2">
              (Use your computer's IP address, not localhost)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
