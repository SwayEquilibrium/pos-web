'use client'

import { useState, useEffect } from 'react'

export default function ESCPOSTestPage() {
  const [result, setResult] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendESCPOSJob = async () => {
    setResult('🧪 Sending ESC/POS formatted job...')
    
    try {
      // Create ESC/POS commands for TSP100
      const escposContent = [
        '\x1B\x40',           // Initialize printer
        '\x1B\x61\x01',       // Center alignment
        '\x1B\x21\x30',       // Double width/height
        '*** KITCHEN ORDER ***\n',
        '\x1B\x21\x00',       // Normal size
        '\x1B\x61\x00',       // Left alignment
        '\n',
        'Order #12345\n',
        'Table: 5\n',
        'Time: ' + new Date().toLocaleTimeString() + '\n',
        '\n',
        '2x Grilled Chicken\n',
        '- No mayo\n', 
        '- Extra pickles\n',
        '\n',
        '1x Fries\n',
        '- Large\n',
        '\n',
        '--------------------------------\n',
        '\x1B\x61\x01',       // Center alignment
        'TOTAL: $24.99\n',
        '\x1B\x61\x00',       // Left alignment
        '\n\n\n',
        '\x1D\x56\x42\x00'    // Partial cut
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: escposContent,
          contentType: 'application/vnd.star.starprnt', // ESC/POS format
          orderId: 'test-escpos-' + Date.now(),
          receiptType: 'kitchen'
        })
      })

      if (response.ok) {
        setResult('✅ ESC/POS job queued! Watch for physical printing...')
      } else {
        setResult('❌ Failed to queue ESC/POS job: ' + response.statusText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  const sendPlainTextJob = async () => {
    setResult('📝 Sending plain text job...')
    
    try {
      const plainContent = [
        '*** PLAIN TEXT TEST ***',
        '',
        'Order #67890',
        'Table: 3', 
        'Time: ' + new Date().toLocaleTimeString(),
        '',
        '1x Burger',
        '2x Coke',
        '',
        'Total: $15.99',
        '',
        '--- END OF ORDER ---',
        ''
      ].join('\n')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: plainContent,
          contentType: 'text/plain',
          orderId: 'test-plain-' + Date.now(),
          receiptType: 'kitchen'
        })
      })

      if (response.ok) {
        setResult('✅ Plain text job queued! Watch for physical printing...')
      } else {
        setResult('❌ Failed to queue plain text job: ' + response.statusText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🖨️ ESC/POS Printing Test
        </h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            🎯 Perfect CloudPRNT Protocol Detected!
          </h2>
          <div className="text-yellow-700 space-y-2">
            <div>✅ POST request from printer - SUCCESS</div>
            <div>✅ Server responds with jobReady: true - SUCCESS</div>
            <div>✅ GET request from printer - SUCCESS</div>
            <div>✅ Job content delivered (221 chars) - SUCCESS</div>
            <div className="text-red-600 font-semibold">❓ Physical printing status: UNKNOWN</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🔧 ESC/POS Test</h2>
            <p className="text-gray-600 mb-4">
              Send a job with proper ESC/POS printer commands for TSP100
            </p>
            <button
              onClick={sendESCPOSJob}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600 font-semibold"
            >
              Send ESC/POS Job
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Plain Text Test</h2>
            <p className="text-gray-600 mb-4">
              Send a simple plain text job (current format)
            </p>
            <button
              onClick={sendPlainTextJob}
              className="w-full bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600 font-semibold"
            >
              Send Plain Text Job
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Result</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm min-h-[100px]">
            {result || 'Click a test button to start...'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            🔍 What to Check
          </h2>
          <div className="space-y-3 text-blue-700">
            <div><strong>1. Physical Paper:</strong> Is paper loaded correctly in TSP100?</div>
            <div><strong>2. Paper Size:</strong> TSP100 expects 80mm thermal paper</div>
            <div><strong>3. Printer Errors:</strong> Any error lights on the printer?</div>
            <div><strong>4. Content Format:</strong> TSP100 might need ESC/POS commands</div>
            <div><strong>5. Print Mode:</strong> Check printer settings for text/graphics mode</div>
          </div>
        </div>
      </div>
    </div>
  )
}
