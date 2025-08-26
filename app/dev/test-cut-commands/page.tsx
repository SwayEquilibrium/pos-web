'use client'

import { useState, useEffect } from 'react'

export default function TestCutCommandsPage() {
  const [mounted, setMounted] = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendCutTest = async (cutType: 'partial' | 'full' | 'feed_and_cut' | 'no_cut') => {
    setTestResult(`🧪 Testing ${cutType} cut command...`)
    
    try {
      const ESC = String.fromCharCode(27)
      const GS = String.fromCharCode(29)
      
      let cutCommand = ''
      switch (cutType) {
        case 'partial':
          cutCommand = GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0)
          break
        case 'full':
          cutCommand = GS + 'V' + String.fromCharCode(65) + String.fromCharCode(0)
          break
        case 'feed_and_cut':
          cutCommand = GS + 'V' + String.fromCharCode(66) + String.fromCharCode(3)
          break
        case 'no_cut':
          cutCommand = '' // No cut command
          break
      }

      const testContent = [
        ESC + '@',            // Initialize printer
        ESC + 'a' + String.fromCharCode(1),  // Center alignment
        '*** CUT TEST ***\n',
        ESC + 'a' + String.fromCharCode(0),  // Left alignment
        '\n',
        `Testing: ${cutType.toUpperCase().replace('_', ' ')}\n`,
        'Time: ' + new Date().toLocaleTimeString() + '\n',
        '\n',
        'This receipt should demonstrate\n',
        `the ${cutType} cutting behavior.\n`,
        '\n',
        '--- END OF RECEIPT ---\n',
        '\n\n',
        cutCommand // Apply the selected cut command
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: testContent,
          contentType: 'application/vnd.star.starprnt',
          orderId: null,
          receiptType: `cut-test-${cutType}`
        })
      })

      if (response.ok) {
        setTestResult(`✅ ${cutType.toUpperCase()} cut test sent!

Check the printer to see how it cuts the paper:
- Partial Cut: Perforated, easy to tear
- Full Cut: Complete separation
- Feed & Cut: Extra paper feed before cutting
- No Cut: Paper continues (manual tear needed)`)
      } else {
        const errorText = await response.text()
        setTestResult('❌ Failed: ' + response.status + ' - ' + errorText)
      }
    } catch (error) {
      setTestResult('❌ Error: ' + error)
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ✂️ Test Cut Commands
        </h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            ⚠️ Current Status
          </h2>
          <div className="text-yellow-700 space-y-2">
            <div>✅ <strong>Partial Cut:</strong> Currently implemented (default)</div>
            <div>❌ <strong>MQTT:</strong> Not set up (using HTTP CloudPRNT polling)</div>
            <div>📋 <strong>Cut Command:</strong> GS + 'V' + 66 + 0 (Partial Cut)</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => sendCutTest('partial')}
            className="bg-blue-500 text-white py-4 px-4 rounded hover:bg-blue-600 font-semibold text-center"
          >
            ✂️ Partial Cut
            <div className="text-sm mt-1 opacity-80">(Current)</div>
          </button>

          <button
            onClick={() => sendCutTest('full')}
            className="bg-red-500 text-white py-4 px-4 rounded hover:bg-red-600 font-semibold text-center"
          >
            ✂️ Full Cut
            <div className="text-sm mt-1 opacity-80">(Complete)</div>
          </button>

          <button
            onClick={() => sendCutTest('feed_and_cut')}
            className="bg-green-500 text-white py-4 px-4 rounded hover:bg-green-600 font-semibold text-center"
          >
            📄 Feed & Cut
            <div className="text-sm mt-1 opacity-80">(Extra Space)</div>
          </button>

          <button
            onClick={() => sendCutTest('no_cut')}
            className="bg-gray-500 text-white py-4 px-4 rounded hover:bg-gray-600 font-semibold text-center"
          >
            🚫 No Cut
            <div className="text-sm mt-1 opacity-80">(Manual)</div>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Test Result</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm min-h-[150px] whitespace-pre-line">
            {testResult || 'Click a cut test button above to start...'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              ✂️ Cut Command Details
            </h2>
            <div className="text-blue-700 space-y-2 text-sm">
              <div><strong>Partial Cut (66):</strong> GS + 'V' + 66 + 0</div>
              <div><strong>Full Cut (65):</strong> GS + 'V' + 65 + 0</div>
              <div><strong>Feed & Cut:</strong> GS + 'V' + 66 + 3</div>
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <strong>Current:</strong> Using partial cut for all receipts
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-800 mb-4">
              📡 MQTT vs HTTP CloudPRNT
            </h2>
            <div className="text-orange-700 space-y-2 text-sm">
              <div><strong>Current:</strong> HTTP Polling</div>
              <div>• Printer polls server every few seconds</div>
              <div>• Simple setup, works reliably</div>
              <div className="mt-3">
                <strong>MQTT Alternative:</strong>
              </div>
              <div>• Real-time push notifications</div>
              <div>• Requires MQTT broker setup</div>
              <div>• TSP100IV firmware 2.2+ needed</div>
              <div className="mt-4 p-3 bg-orange-100 rounded">
                <strong>Recommendation:</strong> HTTP is working fine, MQTT optional
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
