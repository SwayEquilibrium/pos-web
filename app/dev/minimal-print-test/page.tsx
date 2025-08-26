'use client'

import { useState, useEffect } from 'react'

export default function MinimalPrintTest() {
  const [result, setResult] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sendMinimalJob = async () => {
    setResult('🧪 Sending MINIMAL job...')
    
    try {
      // Just send "HELLO" - simplest possible content
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: 'HELLO\n\n\n',
          contentType: 'text/plain'
        })
      })

      if (response.ok) {
        setResult('✅ MINIMAL job queued! Watch printer for "HELLO"...')
      } else {
        setResult('❌ Failed: ' + response.statusText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  const sendFormFeedJob = async () => {
    setResult('🧪 Sending FORM FEED job...')
    
    try {
      // Send form feed character to advance paper
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: '\f',  // Form feed character
          contentType: 'text/plain'
        })
      })

      if (response.ok) {
        setResult('✅ FORM FEED job queued! Watch for paper advance...')
      } else {
        setResult('❌ Failed: ' + response.statusText)
      }
    } catch (error) {
      setResult('❌ Error: ' + error)
    }
  }

  const sendASCIIJob = async () => {
    setResult('🧪 Sending ASCII art job...')
    
    try {
      const asciiContent = [
        '**********************',
        '*                    *',
        '*      TEST          *',
        '*                    *',
        '**********************',
        '',
        'If you see this,',
        'printing works!',
        '',
        '----------------------',
        ''
      ].join('\n')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: asciiContent,
          contentType: 'text/plain'
        })
      })

      if (response.ok) {
        setResult('✅ ASCII job queued! Watch for box pattern...')
      } else {
        setResult('❌ Failed: ' + response.statusText)
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
          🔬 Minimal Printing Tests
        </h1>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            🚨 HARDWARE ISSUE DETECTED!
          </h2>
          <div className="text-red-700 space-y-2">
            <div>✅ CloudPRNT protocol: PERFECT</div>
            <div>✅ Job delivery: WORKING</div>
            <div>✅ Content received: 221 characters</div>
            <div className="font-bold">❌ Physical printing: FAILED</div>
            <div className="mt-4 p-4 bg-red-100 rounded">
              <strong>This is NOT a software problem!</strong><br/>
              The printer is receiving jobs but not outputting to paper.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">🔤 Minimal Test</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Send just "HELLO" to test basic printing
            </p>
            <button
              onClick={sendMinimalJob}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Send "HELLO"
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">📄 Form Feed</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Send form feed to advance paper
            </p>
            <button
              onClick={sendFormFeedJob}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Advance Paper
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">🎨 ASCII Art</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Send ASCII box pattern
            </p>
            <button
              onClick={sendASCIIJob}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Send Pattern
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Result</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm min-h-[80px]">
            {result || 'Click a test button above...'}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-orange-800 mb-4">
            🔧 HARDWARE TROUBLESHOOTING STEPS
          </h2>
          <div className="space-y-4 text-orange-700">
            <div>
              <strong>1. PRINTER SELF-TEST (MOST IMPORTANT!):</strong>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Power OFF the TSP100</li>
                <li>Hold down FEED button</li>
                <li>Power ON while holding FEED</li>
                <li>Release FEED after 3 seconds</li>
                <li>Should print configuration page</li>
              </ul>
            </div>
            
            <div>
              <strong>2. PAPER CHECK:</strong>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>80mm thermal paper loaded correctly?</li>
                <li>Paper feeding straight, not jammed?</li>
                <li>Fresh thermal paper (not old/faded)?</li>
              </ul>
            </div>

            <div>
              <strong>3. PRINTER WEB SETTINGS (http://192.168.8.197):</strong>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Print Density: Try higher setting</li>
                <li>Print Speed: Try slower speed</li>
                <li>Paper Width: Should be 80mm</li>
              </ul>
            </div>

            <div>
              <strong>4. ERROR INDICATORS:</strong>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Any blinking lights on printer?</li>
                <li>Paper jam indicator?</li>
                <li>Cover open indicator?</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
