'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrinterConfigFix() {
  const [step, setStep] = useState(1)

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 TSP100 WebPRNT Configuration Fix</CardTitle>
          <CardDescription>
            Your printer is responding but WebPRNT is disabled. Let's enable it!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diagnosis */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium mb-2">🕵️ Diagnosis Complete:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ <strong>Network:</strong> Printer is reachable at 192.168.8.197</li>
              <li>✅ <strong>Power:</strong> Printer is responding to requests</li>
              <li>❌ <strong>WebPRNT:</strong> Disabled - redirecting to web interface</li>
              <li>🔧 <strong>Solution:</strong> Enable WebPRNT in printer settings</li>
            </ul>
          </div>

          {/* Step-by-step fix */}
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${step >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 1: Access Printer Web Interface</h3>
                <Button 
                  onClick={() => setStep(2)} 
                  variant={step >= 1 ? "default" : "outline"}
                  size="sm"
                >
                  {step >= 1 ? "✅ Done" : "Start"}
                </Button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open a new browser tab</li>
                <li>Go to: <strong>http://192.168.8.197</strong></li>
                <li>You should see the Star printer web interface</li>
                <li>Look for a login or settings section</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg border-2 ${step >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 2: Find WebPRNT Settings</h3>
                <Button 
                  onClick={() => setStep(3)} 
                  variant={step >= 2 ? "default" : "outline"}
                  size="sm"
                  disabled={step < 2}
                >
                  {step >= 2 ? "✅ Done" : "Next"}
                </Button>
              </div>
              <div className="text-sm space-y-2">
                <p>Look for these menu items (they vary by firmware):</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>"WebPRNT"</strong> or <strong>"Web Printing"</strong></li>
                  <li><strong>"Network Settings"</strong> → <strong>"WebPRNT"</strong></li>
                  <li><strong>"Printing Options"</strong> → <strong>"WebPRNT"</strong></li>
                  <li><strong>"Advanced"</strong> → <strong>"WebPRNT"</strong></li>
                </ul>
                <p className="text-yellow-700 bg-yellow-100 p-2 rounded mt-2">
                  <strong>Note:</strong> Some TSP100 models require admin login. Try: admin/admin or root/root
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${step >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 3: Enable WebPRNT</h3>
                <Button 
                  onClick={() => setStep(4)} 
                  variant={step >= 3 ? "default" : "outline"}
                  size="sm"
                  disabled={step < 3}
                >
                  {step >= 3 ? "✅ Done" : "Next"}
                </Button>
              </div>
              <div className="text-sm space-y-2">
                <p>In the WebPRNT settings:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>✅ <strong>Enable WebPRNT:</strong> Check this box</li>
                  <li>✅ <strong>Port:</strong> Should be 80 (default)</li>
                  <li>✅ <strong>Print Density:</strong> Set to 80-100%</li>
                  <li>✅ <strong>Paper Width:</strong> Match your paper (usually 80mm)</li>
                </ul>
                <div className="bg-green-100 p-2 rounded mt-2">
                  <strong>💡 Key Setting:</strong> Make sure "Enable WebPRNT" or "WebPRNT Function" is <strong>ON/Enabled</strong>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${step >= 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 4: Save & Restart</h3>
                <Button 
                  onClick={() => setStep(5)} 
                  variant={step >= 4 ? "default" : "outline"}
                  size="sm"
                  disabled={step < 4}
                >
                  {step >= 4 ? "✅ Done" : "Next"}
                </Button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click <strong>"Save"</strong> or <strong>"Apply"</strong></li>
                <li>The printer may restart automatically</li>
                <li>If not, power cycle the printer (unplug/plug back in)</li>
                <li>Wait 30 seconds for full startup</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg border-2 ${step >= 5 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Step 5: Test WebPRNT</h3>
                <Button 
                  onClick={() => window.open('/dev/direct-print-test', '_blank')} 
                  variant="default"
                  size="sm"
                  disabled={step < 5}
                  className="bg-green-600 hover:bg-green-700"
                >
                  🖨️ Test Now
                </Button>
              </div>
              <p className="text-sm">
                Once WebPRNT is enabled, go back to the Direct Print Test and try printing again.
                You should now see actual print output instead of HTML redirects!
              </p>
            </div>
          </div>

          {/* Alternative Solutions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🔄 Alternative Solutions:</h3>
            <div className="text-sm space-y-2">
              <p><strong>If you can't find WebPRNT settings:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Try firmware update from Star Micronics website</li>
                <li>Look for "Factory Reset" to restore default settings</li>
                <li>Check if your TSP100 model supports WebPRNT (most do)</li>
                <li>Try different browser (some settings only work in IE/Edge)</li>
              </ul>
              
              <p className="mt-3"><strong>Common TSP100 WebPRNT URLs to try:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>http://192.168.8.197/webprnt</li>
                <li>http://192.168.8.197/settings</li>
                <li>http://192.168.8.197/admin</li>
                <li>http://192.168.8.197/config</li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => window.open('http://192.168.8.197', '_blank')}
              variant="outline"
            >
              🌐 Open Printer Web Interface
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/printer-physical-test', '_blank')}
              variant="outline"
            >
              🔧 Run Physical Tests
            </Button>
            
            <Button 
              onClick={() => window.open('/dev/direct-print-test', '_blank')}
              variant="outline"
            >
              🖨️ Direct Print Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
