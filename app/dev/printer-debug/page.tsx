'use client'

import { useState, useEffect } from 'react'

export default function PrinterDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
  }

  const testDirectPrint = async () => {
    addLog('🧪 Testing direct printer communication...')
    
    try {
      // Test if printer is reachable
      addLog('📡 Testing printer connectivity...')
      const response = await fetch('http://192.168.8.197/', { mode: 'no-cors' })
      addLog('✅ Printer is reachable')
    } catch (error) {
      addLog('❌ Printer not reachable: ' + error)
    }

    try {
      // Check our CloudPRNT endpoint
      addLog('🔍 Testing our CloudPRNT endpoint...')
      const response = await fetch('/api/cloudprnt/tsp100-kitchen/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'test',
          printerMAC: '00:11:62:42:8f:a1',
          statusCode: '200 OK'
        })
      })
      
      const data = await response.json()
      addLog('📊 POST Response: ' + JSON.stringify(data))
      
      if (data.jobReady) {
        addLog('🎯 Job ready! Testing GET request...')
        const getResponse = await fetch('/api/cloudprnt/tsp100-kitchen/job?type=text/plain&mac=00:11:62:42:8f:a1')
        const content = await getResponse.text()
        addLog('📄 GET Response length: ' + content.length + ' chars')
        addLog('📝 Content preview: ' + content.substring(0, 100) + '...')
      }
    } catch (error) {
      addLog('❌ CloudPRNT test failed: ' + error)
    }
  }

  const clearLogs = () => setLogs([])

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Printer Debug & Diagnosis
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🖨️ Printer Info</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Model:</strong> TSP100IV</div>
              <div><strong>IP:</strong> 192.168.8.197</div>
              <div><strong>MAC:</strong> 00:11:62:42:8f:a1</div>
              <div><strong>Expected URL:</strong> http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🚨 Current Issue</h2>
            <div className="text-sm space-y-2">
              <div className="text-red-600">❌ Printer making GET requests only</div>
              <div className="text-red-600">❌ Should make POST then GET</div>
              <div className="text-red-600">❌ Jobs delivered but not printing</div>
              <div className="text-green-600">✅ Network connectivity working</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🧪 Debug Tests</h2>
            <div className="space-x-2">
              <button
                onClick={testDirectPrint}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Run Diagnostic
              </button>
              <button
                onClick={clearLogs}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear Logs
              </button>
            </div>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click "Run Diagnostic" to start testing...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            🔧 Next Steps
          </h2>
          <div className="space-y-3 text-yellow-700">
            <div>1. <strong>Check printer config:</strong> Go to http://192.168.8.197</div>
            <div>2. <strong>Verify CloudPRNT URL:</strong> Should be http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job</div>
            <div>3. <strong>Check protocol version:</strong> Make sure it's using CloudPRNT v2+</div>
            <div>4. <strong>Restart printer:</strong> Power cycle after config changes</div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            📋 Expected Terminal Logs (When Working)
          </h2>
          <div className="bg-white p-4 rounded border font-mono text-sm">
            <div className="text-blue-600">📡 CloudPRNT POST from printer: tsp100-kitchen</div>
            <div className="text-green-600">🎯 Job [ID] available for printer tsp100-kitchen</div>
            <div className="text-blue-600">📥 CloudPRNT GET from printer: tsp100-kitchen</div>
            <div className="text-green-600">✅ Delivering job [ID] content to printer tsp100-kitchen</div>
            <div className="text-purple-600">🖨️ PHYSICAL PRINTING OCCURS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
