'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PrinterConfigHelper() {
  const [step, setStep] = useState(1)
  const [findings, setFindings] = useState<string[]>([])
  const [serverUrl, setServerUrl] = useState('')

  const addFinding = (finding: string) => {
    setFindings(prev => [...prev, `${new Date().toLocaleTimeString()}: ${finding}`])
  }

  const testPrinterAccess = async () => {
    addFinding('🔍 Testing printer web interface access...')

    try {
      // Test if we can reach the printer web interface
      const response = await fetch('http://192.168.8.197', { 
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })
      addFinding('✅ Printer web interface is reachable')
      addFinding('💡 Try opening http://192.168.8.197 in a new browser tab')
      setStep(2)
    } catch (error) {
      addFinding(`❌ Cannot reach printer: ${error}`)
      addFinding('💡 Check if printer IP is correct and printer is powered on')
    }
  }

  const checkCloudPRNTSupport = () => {
    addFinding('🔍 Checking if your TSP100 supports CloudPRNT...')
    addFinding('💡 Most TSP100 models support CloudPRNT, but some older ones only support WebPRNT')
    addFinding('💡 Look for "CloudPRNT", "Cloud Printing", or "Network Printing" in your printer settings')
    addFinding('💡 If you only see "WebPRNT" settings, your model might not support CloudPRNT')
    setStep(3)
  }

  const generateServerUrls = () => {
    const baseUrl = window.location.origin
    const printerId = 'tsp100-kitchen'
    
    const urls = [
      `${baseUrl}/api/cloudprnt/${printerId}/job`,
      `http://localhost:3000/api/cloudprnt/${printerId}/job`,
      `http://192.168.8.164:3000/api/cloudprnt/${printerId}/job`, // Your network IP
    ]

    addFinding('📋 Try these Server URLs in your printer CloudPRNT settings:')
    urls.forEach((url, index) => {
      addFinding(`   ${index + 1}. ${url}`)
    })
    addFinding('💡 Start with #1, if that doesn\'t work try #2, then #3')
    setServerUrl(urls[0])
    setStep(4)
  }

  const testServerUrl = async () => {
    if (!serverUrl) return

    addFinding(`🔍 Testing server URL: ${serverUrl}`)

    try {
      // Test if our API endpoint is reachable
      const response = await fetch(serverUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.status === 204) {
        addFinding('✅ Server URL is working! (204 No Content = no jobs available)')
        addFinding('💡 This URL should work in your printer settings')
      } else if (response.status === 404) {
        addFinding('❌ Server URL returns 404 - CloudPRNT feature might not be enabled')
        addFinding('💡 Check if printerCloudPRNTV1 flag is enabled in your .env.local')
      } else {
        addFinding(`⚠️ Server URL returns ${response.status} - might still work`)
      }
    } catch (error) {
      addFinding(`❌ Server URL test failed: ${error}`)
      addFinding('💡 Try a different URL from the list above')
    }
  }

  const checkPrinterPolling = async () => {
    addFinding('🔍 Checking if printer is actually polling...')

    try {
      const response = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
      const data = await response.json()

      const queuedJobs = data.jobs?.filter((j: any) => j.status === 'QUEUED').length || 0
      const deliveredJobs = data.jobs?.filter((j: any) => j.status === 'DELIVERED').length || 0

      addFinding(`📊 Current queue status:`)
      addFinding(`   QUEUED jobs: ${queuedJobs}`)
      addFinding(`   DELIVERED jobs: ${deliveredJobs}`)

      if (queuedJobs > 0 && deliveredJobs === 0) {
        addFinding('❌ Printer is NOT polling - jobs are stuck in QUEUED')
        addFinding('💡 This means CloudPRNT is not properly configured in your printer')
      } else if (deliveredJobs > 0) {
        addFinding('✅ Printer IS polling - some jobs have been delivered')
        addFinding('💡 CloudPRNT is working, but printer might not be physically printing')
      }
    } catch (error) {
      addFinding(`❌ Queue check failed: ${error}`)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 Printer Configuration Troubleshooting</CardTitle>
          <CardDescription>
            Step-by-step help to get your TSP100 polling for CloudPRNT jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Issue */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium mb-2">🤔 Current Issue:</h3>
            <p className="text-sm">
              <strong>Jobs stay QUEUED</strong> - This means your printer is not polling the server for jobs. 
              The CloudPRNT software is working perfectly, but the printer configuration needs adjustment.
            </p>
          </div>

          {/* Step-by-step troubleshooting */}
          <div className="space-y-4">
            <div className={`border-2 p-4 rounded-lg ${step >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 1: Test Printer Access</h3>
                <Button 
                  onClick={testPrinterAccess}
                  variant={step >= 1 ? "default" : "outline"}
                  size="sm"
                >
                  Test Access
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                First, let's make sure we can reach your printer's web interface.
              </p>
            </div>

            <div className={`border-2 p-4 rounded-lg ${step >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 2: Check CloudPRNT Support</h3>
                <Button 
                  onClick={checkCloudPRNTSupport}
                  variant={step >= 2 ? "default" : "outline"}
                  size="sm"
                  disabled={step < 2}
                >
                  Check Support
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Verify your TSP100 model supports CloudPRNT functionality.
              </p>
            </div>

            <div className={`border-2 p-4 rounded-lg ${step >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 3: Generate Server URLs</h3>
                <Button 
                  onClick={generateServerUrls}
                  variant={step >= 3 ? "default" : "outline"}
                  size="sm"
                  disabled={step < 3}
                >
                  Generate URLs
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Get the correct server URLs to use in your printer settings.
              </p>
            </div>

            <div className={`border-2 p-4 rounded-lg ${step >= 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="space-y-2">
                <h3 className="font-medium">Step 4: Test Server URL</h3>
                <div className="flex gap-2">
                  <Input
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="Server URL"
                    className="flex-1"
                    disabled={step < 4}
                  />
                  <Button 
                    onClick={testServerUrl}
                    disabled={step < 4 || !serverUrl}
                    size="sm"
                  >
                    Test URL
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Verify the server URL is working before configuring your printer.
                </p>
              </div>
            </div>

            <div className="border-2 p-4 rounded-lg border-green-500 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 5: Check Polling Status</h3>
                <Button 
                  onClick={checkPrinterPolling}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Check Polling
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                See if your printer is actually polling for jobs after configuration.
              </p>
            </div>
          </div>

          {/* Findings */}
          {findings.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white">Troubleshooting Results:</h3>
                <Button 
                  onClick={() => setFindings([])} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-800"
                >
                  Clear
                </Button>
              </div>
              {findings.map((finding, index) => (
                <div key={index} className="mb-1">
                  {finding}
                </div>
              ))}
            </div>
          )}

          {/* Manual Configuration Guide */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🛠️ Manual Printer Configuration:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Open printer web interface:</strong> http://192.168.8.197</li>
              <li><strong>Login:</strong> Try admin/admin, root/root, or no login</li>
              <li><strong>Find CloudPRNT settings:</strong> Look for "CloudPRNT", "Cloud Printing", or "Network Printing"</li>
              <li><strong>Enable CloudPRNT:</strong> Turn ON the CloudPRNT feature</li>
              <li><strong>Set Server URL:</strong> Use one of the URLs generated above</li>
              <li><strong>Set Poll Interval:</strong> 10-15 seconds</li>
              <li><strong>Save settings:</strong> Apply changes and restart printer if needed</li>
            </ol>
          </div>

          {/* Alternative Solutions */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🚨 If CloudPRNT Settings Don't Exist:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Your TSP100 model might not support CloudPRNT</strong></li>
              <li>Some older TSP100s only support WebPRNT or direct printing</li>
              <li>Check your printer model number and firmware version</li>
              <li>Consider firmware update from Star Micronics website</li>
              <li>We can fall back to direct ESC/POS printing if needed</li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => window.open('http://192.168.8.197', '_blank')}
              variant="outline"
            >
              🌐 Open Printer Interface
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/cloudprnt-setup', '_blank')}
              variant="outline"
            >
              ☁️ CloudPRNT Setup
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/cloudprnt', '_blank')}
              variant="outline"
            >
              🖨️ Test CloudPRNT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
