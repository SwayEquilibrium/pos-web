'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CloudPRNTAuthTest() {
  const [results, setResults] = useState<string[]>([])
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testAuthConfigs = async () => {
    addResult('🔍 Testing different CloudPRNT authentication configurations...')

    // Test configurations to try
    const configs = [
      { name: 'No Auth', url: 'http://localhost:3000/api/cloudprnt/tsp100-kitchen/job' },
      { name: 'Basic Auth (admin:admin)', url: `http://${username}:${password}@localhost:3000/api/cloudprnt/tsp100-kitchen/job` },
      { name: 'Query Params', url: `http://localhost:3000/api/cloudprnt/tsp100-kitchen/job?user=${username}&pass=${password}` },
    ]

    configs.forEach(config => {
      addResult(`📋 ${config.name}:`)
      addResult(`   URL: ${config.url}`)
    })

    addResult('')
    addResult('💡 Try each URL in your printer CloudPRNT settings')
  }

  const testPrinterAccess = async () => {
    addResult('🔍 Testing printer web interface access...')

    try {
      // Test basic access to printer
      const response = await fetch('http://192.168.8.197', { 
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })
      addResult('✅ Printer web interface is accessible')
    } catch (error) {
      addResult(`❌ Cannot access printer: ${error}`)
    }

    // Test common login credentials
    const commonCreds = [
      { user: 'admin', pass: 'admin' },
      { user: 'root', pass: 'root' },
      { user: 'admin', pass: '' },
      { user: '', pass: '' }
    ]

    addResult('')
    addResult('🔑 Common TSP100 login credentials to try:')
    commonCreds.forEach(cred => {
      addResult(`   Username: "${cred.user}" Password: "${cred.pass}"`)
    })
  }

  const checkPrinterPolling = async () => {
    addResult('🔍 Checking if printer is polling our server...')

    try {
      // Check recent jobs to see if printer is polling
      const response = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
      const data = await response.json()

      if (data.jobs && data.jobs.length > 0) {
        const queuedJobs = data.jobs.filter((j: any) => j.status === 'QUEUED')
        const deliveredJobs = data.jobs.filter((j: any) => j.status === 'DELIVERED')

        addResult(`📊 Queue Status:`)
        addResult(`   QUEUED jobs: ${queuedJobs.length}`)
        addResult(`   DELIVERED jobs: ${deliveredJobs.length}`)

        if (deliveredJobs.length > 0) {
          addResult('✅ Printer IS polling - jobs are being delivered')
          addResult('❌ But printer is not physically printing')
          addResult('💡 This suggests a printer configuration issue')
        } else if (queuedJobs.length > 0) {
          addResult('❌ Printer is NOT polling - jobs stuck in QUEUED')
          addResult('💡 Check CloudPRNT settings in printer web interface')
        }
      } else {
        addResult('ℹ️ No jobs in queue to analyze')
      }
    } catch (error) {
      addResult(`❌ Error checking queue: ${error}`)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔐 CloudPRNT Authentication Troubleshooting</CardTitle>
          <CardDescription>
            Help configure authentication for your TSP100 CloudPRNT settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Issue */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium mb-2">🤔 Current Issue:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Jobs are being queued successfully</li>
              <li>❌ Printer is not physically printing</li>
              <li>❓ Printer asking for username/password</li>
            </ul>
          </div>

          {/* Auth Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-medium">Credentials to Test:</h3>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Quick Tests:</h3>
              <div className="space-y-2">
                <Button onClick={testAuthConfigs} variant="outline" className="w-full">
                  🔗 Generate Auth URLs
                </Button>
                <Button onClick={testPrinterAccess} variant="outline" className="w-full">
                  🔍 Test Printer Access
                </Button>
                <Button onClick={checkPrinterPolling} variant="outline" className="w-full">
                  📡 Check Printer Polling
                </Button>
              </div>
            </div>
          </div>

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

          {/* Troubleshooting Guide */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">🛠️ TSP100 CloudPRNT Configuration Steps:</h3>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li><strong>Access Printer:</strong> Go to http://192.168.8.197</li>
                <li><strong>Login:</strong> Try admin/admin, root/root, or no login</li>
                <li><strong>Find CloudPRNT:</strong> Look for "CloudPRNT" or "Cloud Printing" settings</li>
                <li><strong>Enable CloudPRNT:</strong> Turn ON the CloudPRNT feature</li>
                <li><strong>Set Server URL:</strong> Use one of the generated URLs above</li>
                <li><strong>Set Poll Interval:</strong> 10-15 seconds</li>
                <li><strong>Save & Restart:</strong> Apply settings and restart printer</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">✅ Common Solutions:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>No Auth Needed:</strong> Most TSP100s work without authentication</li>
                <li><strong>Basic Auth:</strong> Some require admin/admin in the URL</li>
                <li><strong>Firmware Update:</strong> Older firmware might need updates</li>
                <li><strong>Factory Reset:</strong> Reset printer to defaults if stuck</li>
                <li><strong>Paper Check:</strong> Ensure thermal paper is loaded correctly</li>
              </ul>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">🚨 If Still Not Working:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Check if CloudPRNT is supported on your TSP100 model</li>
                <li>Some older TSP100s only support WebPRNT</li>
                <li>Try different firmware versions</li>
                <li>Contact Star Micronics support with your model number</li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => window.open('http://192.168.8.197', '_blank')}
              variant="outline"
            >
              🌐 Open Printer Interface
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/cloudprnt', '_blank')}
              variant="outline"
            >
              🖨️ CloudPRNT Test Page
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/cloudprnt-debug', '_blank')}
              variant="outline"
            >
              🔧 CloudPRNT Debug
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
