'use client'

import { useState, useEffect } from 'react'

export default function ESCPOSFixPage() {
  const [result, setResult] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendProperESCPOS = async () => {
    setResult('🧪 Sending PROPER ESC/POS commands...')
    
    try {
      // ESC/POS commands using String.fromCharCode to avoid Unicode issues
      const ESC = String.fromCharCode(27)  // ESC character
      const escposContent = [
        ESC + '@',            // Initialize printer
        ESC + 'a' + String.fromCharCode(1),  // Center alignment
        '*** TEST PRINT ***\n',
        ESC + 'a' + String.fromCharCode(0),  // Left alignment
        '\n',
        'Kitchen Order #123\n',
        'Table: 5\n',
        'Time: ' + new Date().toLocaleTimeString() + '\n',
        '\n',
        '2x Grilled Chicken\n',
        '1x Fries\n',
        '\n',
        'Total: $24.99\n',
        '\n\n\n'
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: escposContent,
          contentType: 'application/vnd.star.starprnt',
          orderId: null, // Set to null to avoid UUID validation
          receiptType: 'kitchen'
        })
      })

      if (response.ok) {
        setResult('✅ ESC/POS job queued! This SHOULD print!')
      } else {
        const errorText = await response.text()
        setResult('❌ Failed: ' + response.status + ' - ' + errorText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  const sendSimpleESCPOS = async () => {
    setResult('🧪 Sending SIMPLE ESC/POS...')
    
    try {
      // Simplest possible ESC/POS using String.fromCharCode
      const ESC = String.fromCharCode(27)  // ESC character
      const GS = String.fromCharCode(29)   // GS character
      const simple = [
        ESC + '@',         // Initialize
        'HELLO WORLD\n',   // Text
        '\n\n',            // Line feeds  
        GS + 'V' + String.fromCharCode(0)  // Cut paper
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: simple,
          contentType: 'application/vnd.star.starprnt',
          orderId: null,
          receiptType: 'test'
        })
      })

      if (response.ok) {
        setResult('✅ Simple ESC/POS queued! Watch for "HELLO WORLD"!')
      } else {
        const errorText = await response.text()
        setResult('❌ Failed: ' + response.status + ' - ' + errorText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  const sendRawText = async () => {
    setResult('🧪 Sending RAW TEXT (current format)...')
    
    try {
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: 'RAW TEXT TEST\nThis is plain text\nNo ESC/POS commands\n\n\n',
          contentType: 'text/plain',
          orderId: null,
          receiptType: 'test'
        })
      })

      if (response.ok) {
        setResult('✅ Raw text queued (probably won\'t print)')
      } else {
        const errorText = await response.text()
        setResult('❌ Failed: ' + response.status + ' - ' + errorText)
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
          🔧 ESC/POS Format Fix
        </h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            🎉 HARDWARE CONFIRMED WORKING!
          </h2>
          <div className="text-green-700 space-y-2">
            <div>✅ Printer can print (self-test works)</div>
            <div>✅ Paper is loaded correctly</div>
            <div>✅ Settings are correct</div>
            <div className="text-red-600 font-semibold">❌ Content format is wrong!</div>
            <div className="mt-4 p-4 bg-green-100 rounded">
              <strong>The issue:</strong> TSP100 needs ESC/POS commands, not plain text!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">🎯 Proper ESC/POS</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Full ESC/POS with formatting commands
            </p>
            <button
              onClick={sendProperESCPOS}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 font-semibold"
            >
              Send ESC/POS Job
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Simple ESC/POS</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Minimal ESC/POS commands
            </p>
            <button
              onClick={sendSimpleESCPOS}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Send Simple Test
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">📝 Raw Text</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Plain text (current broken format)
            </p>
            <button
              onClick={sendRawText}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Send Raw Text
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Result</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm min-h-[80px]">
            {result || 'Click a test button above...'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            🧠 What We Learned
          </h2>
          <div className="space-y-3 text-blue-700">
            <div><strong>✅ CloudPRNT Protocol:</strong> Working perfectly</div>
            <div><strong>✅ Printer Hardware:</strong> Working (prints self-test)</div>
            <div><strong>✅ Network/Communication:</strong> Working</div>
            <div><strong>❌ Content Format:</strong> TSP100 needs ESC/POS, not plain text</div>
            <div className="mt-4 p-4 bg-blue-100 rounded">
              <strong>Solution:</strong> Convert all our print jobs to ESC/POS format!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
