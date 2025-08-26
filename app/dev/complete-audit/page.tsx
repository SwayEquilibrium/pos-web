'use client'

import { useState, useEffect } from 'react'

export default function CompleteAuditPage() {
  const [auditResults, setAuditResults] = useState<any>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    runCompleteAudit()
  }, [])

  const runCompleteAudit = async () => {
    const results: any = {}

    try {
      // 1. Environment Variables Check
      results.env = {
        flags: process.env.NEXT_PUBLIC_FLAGS,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
      }

      // 2. Feature Flags Check
      const { flags } = await import('@/src/config/flags')
      results.featureFlags = {
        printerCloudPRNTV1: flags.printerCloudPRNTV1,
        printerWebPRNTV1: flags.printerWebPRNTV1,
        allFlags: flags
      }

      // 3. Network Configuration
      results.network = {
        currentHost: window.location.host,
        expectedPrinterIP: '192.168.8.197',
        expectedServerIP: '192.168.8.164:3000',
        printerWebInterface: 'http://192.168.8.197',
        expectedCloudPRNTURL: 'http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job'
      }

      // 4. API Endpoints Test
      console.log('🧪 Testing API endpoints...')
      
      // Test CloudPRNT POST
      const postResponse = await fetch('/api/cloudprnt/tsp100-kitchen/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'audit-test',
          printerMAC: '00:11:62:42:8f:a1',
          statusCode: '200 OK'
        })
      })
      
      results.apiTests = {
        cloudprntPost: {
          status: postResponse.status,
          ok: postResponse.ok,
          response: postResponse.ok ? await postResponse.json() : await postResponse.text()
        }
      }

      // If job ready, test GET
      if (postResponse.ok) {
        const postData = await postResponse.json()
        if (postData.jobReady) {
          const getResponse = await fetch('/api/cloudprnt/tsp100-kitchen/job?type=text/plain&mac=00:11:62:42:8f:a1')
          results.apiTests.cloudprntGet = {
            status: getResponse.status,
            ok: getResponse.ok,
            contentLength: getResponse.ok ? (await getResponse.text()).length : 0
          }
        }
      }

      // 5. Database Connection Test
      const dbTestResponse = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'audit-test',
          payload: 'AUDIT TEST',
          contentType: 'text/plain',
          orderId: null,
          receiptType: 'audit'
        })
      })

      results.database = {
        connectionTest: dbTestResponse.ok,
        status: dbTestResponse.status,
        response: dbTestResponse.ok ? 'SUCCESS' : await dbTestResponse.text()
      }

      // 6. Recent Jobs Check
      const recentJobsResponse = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
      results.recentJobs = {
        status: recentJobsResponse.status,
        ok: recentJobsResponse.ok
      }

      setAuditResults(results)

    } catch (error) {
      results.error = error
      setAuditResults(results)
    }
  }

  const testPrinterConnectivity = async () => {
    const results: any = {}

    try {
      // Test if printer web interface is reachable
      const printerResponse = await fetch('http://192.168.8.197/', { 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })
      results.printerWebInterface = 'REACHABLE'
    } catch (error) {
      results.printerWebInterface = 'UNREACHABLE: ' + error
    }

    setAuditResults(prev => ({ ...prev, printerConnectivity: results }))
  }

  const sendTestJobWithMonitoring = async () => {
    const startTime = Date.now()
    
    try {
      // Send a test job
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: 'MONITORED TEST JOB\nTime: ' + new Date().toLocaleTimeString() + '\n\n\n',
          contentType: 'text/plain',
          orderId: null,
          receiptType: 'monitor-test'
        })
      })

      if (response.ok) {
        // Monitor for 30 seconds
        const monitorResults = []
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          
          const queueResponse = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
          const queueData = await queueResponse.text()
          
          monitorResults.push({
            time: Date.now() - startTime,
            queueStatus: queueResponse.status,
            queueLength: queueData.length
          })
        }

        setAuditResults(prev => ({ 
          ...prev, 
          monitoredTest: {
            jobSent: true,
            monitoring: monitorResults,
            note: 'Check terminal logs for POST/GET activity during this test'
          }
        }))
      }
    } catch (error) {
      setAuditResults(prev => ({ 
        ...prev, 
        monitoredTest: { error: error.toString() }
      }))
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Complete System Audit
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Environment Check */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🌍 Environment</h2>
            <div className="space-y-2 text-sm font-mono">
              <div>FLAGS: <span className="text-blue-600">{auditResults.env?.flags || 'Loading...'}</span></div>
              <div>SUPABASE_URL: <span className="text-green-600">{auditResults.env?.supabaseUrl}</span></div>
              <div>SUPABASE_KEY: <span className="text-green-600">{auditResults.env?.supabaseKey}</span></div>
              <div>APP_URL: <span className="text-purple-600">{auditResults.env?.appUrl}</span></div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🚩 Feature Flags</h2>
            <div className="space-y-2 text-sm">
              <div>CloudPRNT: <span className={auditResults.featureFlags?.printerCloudPRNTV1 ? 'text-green-600 font-bold' : 'text-red-600'}>
                {auditResults.featureFlags?.printerCloudPRNTV1 ? '✅ ENABLED' : '❌ DISABLED'}
              </span></div>
              <div>WebPRNT: <span className={auditResults.featureFlags?.printerWebPRNTV1 ? 'text-green-600' : 'text-gray-500'}>
                {auditResults.featureFlags?.printerWebPRNTV1 ? '✅ ENABLED' : '⚪ DISABLED'}
              </span></div>
            </div>
          </div>

          {/* Network Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🌐 Network Config</h2>
            <div className="space-y-2 text-xs font-mono">
              <div><strong>Current Host:</strong> {auditResults.network?.currentHost}</div>
              <div><strong>Printer IP:</strong> {auditResults.network?.expectedPrinterIP}</div>
              <div><strong>Server IP:</strong> {auditResults.network?.expectedServerIP}</div>
              <div className="text-orange-600"><strong>Expected CloudPRNT URL:</strong></div>
              <div className="break-all">{auditResults.network?.expectedCloudPRNTURL}</div>
            </div>
          </div>

          {/* API Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🔌 API Tests</h2>
            <div className="space-y-2 text-sm">
              <div>POST Endpoint: <span className={auditResults.apiTests?.cloudprntPost?.ok ? 'text-green-600' : 'text-red-600'}>
                {auditResults.apiTests?.cloudprntPost?.status || 'Testing...'}
              </span></div>
              {auditResults.apiTests?.cloudprntGet && (
                <div>GET Endpoint: <span className={auditResults.apiTests?.cloudprntGet?.ok ? 'text-green-600' : 'text-red-600'}>
                  {auditResults.apiTests?.cloudprntGet?.status} ({auditResults.apiTests?.cloudprntGet?.contentLength} chars)
                </span></div>
              )}
            </div>
          </div>

          {/* Database */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🗄️ Database</h2>
            <div className="space-y-2 text-sm">
              <div>Connection: <span className={auditResults.database?.connectionTest ? 'text-green-600' : 'text-red-600'}>
                {auditResults.database?.connectionTest ? '✅ SUCCESS' : '❌ FAILED'}
              </span></div>
              <div>Status: {auditResults.database?.status}</div>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Queue Status</h2>
            <div className="space-y-2 text-sm">
              <div>Queue Check: <span className={auditResults.recentJobs?.ok ? 'text-green-600' : 'text-red-600'}>
                {auditResults.recentJobs?.status || 'Testing...'}
              </span></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testPrinterConnectivity}
            className="bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600"
          >
            Test Printer Connectivity
          </button>
          
          <button
            onClick={sendTestJobWithMonitoring}
            className="bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600"
          >
            Send Monitored Test Job
          </button>
          
          <button
            onClick={runCompleteAudit}
            className="bg-purple-500 text-white py-3 px-4 rounded hover:bg-purple-600"
          >
            Re-run Audit
          </button>
        </div>

        {/* Full Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Complete Audit Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(auditResults, null, 2)}
          </pre>
        </div>

        {/* Critical Checklist */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            🚨 CRITICAL CHECKLIST - VERIFY THESE MANUALLY:
          </h2>
          <div className="space-y-3 text-red-700">
            <div>
              <strong>1. PRINTER WEB INTERFACE:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Go to: <code className="bg-red-100 px-1 rounded">http://192.168.8.197</code></li>
                <li>Navigate to: Network → CloudPRNT</li>
                <li>Server URL MUST be: <code className="bg-red-100 px-1 rounded">http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job</code></li>
                <li>CloudPRNT MUST be: ENABLED</li>
                <li>Poll Interval: 10 seconds</li>
              </ul>
            </div>
            
            <div>
              <strong>2. PHYSICAL PRINTER:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Paper loaded correctly (80mm thermal paper)</li>
                <li>Cover closed properly</li>
                <li>No error lights blinking</li>
                <li>Self-test prints successfully (hold FEED + power on)</li>
              </ul>
            </div>

            <div>
              <strong>3. TERMINAL LOGS:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Should see: "📡 CloudPRNT POST from printer: tsp100-kitchen"</li>
                <li>Should see: "🎯 Job [ID] available for printer tsp100-kitchen"</li>
                <li>Should see: "📥 CloudPRNT GET from printer: tsp100-kitchen"</li>
                <li>Should see: "✅ Delivering job [ID] content to printer tsp100-kitchen"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
