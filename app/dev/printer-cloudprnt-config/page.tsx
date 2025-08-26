'use client'

import { useState, useEffect } from 'react'

export default function PrinterCloudPRNTConfigPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🖨️ TSP100IV CloudPRNT Configuration Guide
        </h1>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            🚨 CRITICAL: Your Printer is Misconfigured!
          </h2>
          <p className="text-red-700 mb-4">
            Your TSP100IV is sending <strong>status callbacks</strong> but NOT <strong>polling for jobs</strong>.
            This means it's configured for status reporting only, not actual printing.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: Access Printer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📱 Step 1: Access Your TSP100IV Web Interface
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-800 font-medium">
                Open your web browser and go to:
              </p>
              <code className="block mt-2 p-2 bg-blue-100 rounded text-lg font-mono">
                http://192.168.8.197
              </code>
            </div>
            <p className="text-gray-600">
              If you can't access this, make sure your computer is on the same network as the printer.
            </p>
          </div>

          {/* Step 2: CloudPRNT Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ⚙️ Step 2: Configure CloudPRNT Settings
            </h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Navigate to: Network → CloudPRNT
                </h3>
                <p className="text-yellow-700">
                  Look for "CloudPRNT" or "Cloud Print" settings in the network menu.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">
                  ✅ Required Settings:
                </h3>
                <div className="space-y-3 text-green-700">
                  <div className="flex items-start space-x-3">
                    <span className="font-medium min-w-[120px]">Enable:</span>
                    <span>✅ ON/Enabled</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="font-medium min-w-[120px]">Server URL:</span>
                    <code className="bg-green-100 px-2 py-1 rounded">
                      http://localhost:3000/api/cloudprnt/tsp100-kitchen/job
                    </code>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="font-medium min-w-[120px]">Poll Interval:</span>
                    <span>10 seconds (or 5-15 seconds)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="font-medium min-w-[120px]">Authentication:</span>
                    <span>None (leave username/password empty)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="font-medium min-w-[120px]">HTTPS:</span>
                    <span>❌ Disabled (use HTTP)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Advanced Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🔧 Step 3: Check Advanced CloudPRNT Settings
            </h2>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-3">
                ⚠️ Critical Settings to Verify:
              </h3>
              <div className="space-y-2 text-orange-700">
                <div>• <strong>Job Polling:</strong> Must be ENABLED</div>
                <div>• <strong>Status Callback:</strong> Optional (currently working)</div>
                <div>• <strong>Print Mode:</strong> Set to "Text" or "Auto"</div>
                <div>• <strong>Content Type:</strong> Accept "text/plain"</div>
                <div>• <strong>Timeout:</strong> 30 seconds or more</div>
              </div>
            </div>
          </div>

          {/* Step 4: Firmware Check */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📋 Step 4: Verify Firmware Version
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                TSP100IV CloudPRNT Requirements:
              </h3>
              <div className="text-blue-700 space-y-1">
                <div>• <strong>Minimum Firmware:</strong> 1.0 or later</div>
                <div>• <strong>HTTP Support:</strong> ✅ Supported</div>
                <div>• <strong>HTTPS Support:</strong> ✅ Supported (TLS 1.2/1.3)</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>To check firmware version:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Go to printer web interface</li>
                <li>Navigate to "Information" or "Status"</li>
                <li>Look for "Firmware Version" or "Main Version"</li>
              </ol>
            </div>
          </div>

          {/* Step 5: Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🧪 Step 5: Test the Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  After saving settings:
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>Save and restart the printer</li>
                  <li>Wait 30 seconds for initialization</li>
                  <li>Go to: <code className="bg-green-100 px-1 rounded">localhost:3000/dev/cloudprnt</code></li>
                  <li>Click "Test CloudPRNT" to queue a job</li>
                  <li>Watch for physical printing within 10 seconds</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🔍 Troubleshooting
            </h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  If still not printing:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  <li>Check if "Job Polling" is specifically enabled</li>
                  <li>Try different Server URL formats (with/without trailing slash)</li>
                  <li>Verify printer can reach your computer's IP</li>
                  <li>Check for firewall blocking port 3000</li>
                  <li>Try using your computer's IP instead of localhost</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Alternative Server URLs to try:
                </h3>
                <div className="space-y-1 text-blue-700 font-mono text-sm">
                  <div>http://localhost:3000/api/cloudprnt/tsp100-kitchen/job</div>
                  <div>http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job</div>
                  <div>http://127.0.0.1:3000/api/cloudprnt/tsp100-kitchen/job</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            🎯 Expected Result
          </h2>
          <p className="text-gray-700">
            After correct configuration, you should see in the terminal logs:
          </p>
          <div className="mt-2 p-3 bg-white rounded border font-mono text-sm">
            📡 CloudPRNT poll from printer: tsp100-kitchen<br/>
            ✅ Delivering job [ID] to printer tsp100-kitchen<br/>
            🖨️ <span className="text-green-600 font-bold">PHYSICAL PAPER SHOULD PRINT!</span>
          </div>
        </div>
      </div>
    </div>
  )
}
