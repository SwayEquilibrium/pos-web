'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimplePrinterTest() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testRawPrint = async () => {
    setLoading(true)
    setMessage('Testing raw print command...')

    try {
      // Send the simplest possible print command directly to the printer
      const printData = `*** SIMPLE TEST ***

This is a basic print test.
Time: ${new Date().toLocaleString()}
Printer: TSP100

If you see this, your printer works!

*** END TEST ***


`

      const response = await fetch('http://192.168.8.197', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: printData,
        signal: AbortSignal.timeout(10000)
      })

      const responseText = await response.text()
      
      setMessage(`✅ Raw print sent!\nStatus: ${response.status}\nResponse: ${responseText.substring(0, 200)}...`)

    } catch (error) {
      setMessage(`❌ Raw print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testESCPOS = async () => {
    setLoading(true)
    setMessage('Testing ESC/POS commands...')

    try {
      // ESC/POS commands for Star printers
      const escpos = [
        '\x1B\x40', // Initialize printer
        '\x1B\x61\x01', // Center alignment
        '\x1B\x45\x01', // Bold on
        '*** STAR TSP100 ***\n',
        '\x1B\x45\x00', // Bold off
        '\x1B\x61\x00', // Left alignment
        '\n',
        'ESC/POS Test Print\n',
        `Time: ${new Date().toLocaleString()}\n`,
        'IP: 192.168.8.197\n',
        '\n',
        'This is a direct ESC/POS command test.\n',
        'If you see this, your printer hardware works!\n',
        '\n',
        '\x1B\x64\x05', // Feed 5 lines
        '\x1B\x69' // Cut paper
      ].join('')

      const response = await fetch('http://192.168.8.197', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: escpos,
        signal: AbortSignal.timeout(10000)
      })

      const responseText = await response.text()
      
      setMessage(`✅ ESC/POS sent!\nStatus: ${response.status}\nResponse: ${responseText.substring(0, 200)}...`)

    } catch (error) {
      setMessage(`❌ ESC/POS failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testNetcatStyle = async () => {
    setLoading(true)
    setMessage('Testing netcat-style raw data...')

    try {
      // Send raw text like netcat would
      const rawText = `
DIRECT PRINTER TEST
==================

This is sent directly to port 80
No WebPRNT, no CloudPRNT, no SDK

Time: ${new Date().toLocaleString()}
Method: Raw HTTP POST
Target: 192.168.8.197

If this prints, your printer accepts raw data!

==================
END TEST


`

      const response = await fetch('http://192.168.8.197', {
        method: 'POST',
        body: rawText,
        signal: AbortSignal.timeout(10000)
      })

      const responseText = await response.text()
      
      setMessage(`✅ Raw data sent!\nStatus: ${response.status}\nResponse: ${responseText.substring(0, 200)}...`)

    } catch (error) {
      setMessage(`❌ Raw data failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testPrinterStatus = async () => {
    setLoading(true)
    setMessage('Checking printer status...')

    try {
      const tests = [
        { name: 'Basic GET', method: 'GET', url: 'http://192.168.8.197' },
        { name: 'Status page', method: 'GET', url: 'http://192.168.8.197/status' },
        { name: 'Info page', method: 'GET', url: 'http://192.168.8.197/info' },
        { name: 'WebPRNT test', method: 'GET', url: 'http://192.168.8.197/webprnt' }
      ]

      let results = []
      
      for (const test of tests) {
        try {
          const response = await fetch(test.url, { 
            method: test.method,
            signal: AbortSignal.timeout(5000)
          })
          results.push(`${test.name}: ${response.status} ${response.statusText}`)
        } catch (error) {
          results.push(`${test.name}: Failed - ${error}`)
        }
      }

      setMessage(`Printer Status Tests:\n${results.join('\n')}`)

    } catch (error) {
      setMessage(`❌ Status check failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 Simple Printer Test - Last Resort</CardTitle>
          <CardDescription>
            Direct printer communication tests - bypassing all protocols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Frustration Acknowledgment */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-medium mb-2">😤 I understand your frustration!</h3>
            <p className="text-sm">
              Let's try the most basic possible tests to see if your printer hardware actually responds to ANY commands.
              These tests bypass WebPRNT, CloudPRNT, and all complex protocols.
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testPrinterStatus} 
              disabled={loading}
              variant="outline"
              className="h-20"
            >
              {loading ? 'Testing...' : '1. Check Printer Status'}
              <div className="text-xs text-gray-600 mt-1">
                Basic connectivity test
              </div>
            </Button>
            
            <Button 
              onClick={testRawPrint} 
              disabled={loading}
              variant="outline"
              className="h-20"
            >
              {loading ? 'Testing...' : '2. Raw Text Print'}
              <div className="text-xs text-gray-600 mt-1">
                Send plain text directly
              </div>
            </Button>
            
            <Button 
              onClick={testESCPOS} 
              disabled={loading}
              variant="outline"
              className="h-20"
            >
              {loading ? 'Testing...' : '3. ESC/POS Commands'}
              <div className="text-xs text-gray-600 mt-1">
                Native printer commands
              </div>
            </Button>
            
            <Button 
              onClick={testNetcatStyle} 
              disabled={loading}
              className="h-20 bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Testing...' : '4. FORCE PRINT'}
              <div className="text-xs text-red-100 mt-1">
                Nuclear option - raw data
              </div>
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-line font-mono ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Physical Checks */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🔍 Physical Checks (Do These First!):</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Power:</strong> Is the printer power LED on?</li>
              <li><strong>Paper:</strong> Press FEED button - does paper advance?</li>
              <li><strong>Paper Type:</strong> Thermal paper (scratch test - should turn black)?</li>
              <li><strong>Paper Orientation:</strong> Thermal side DOWN (towards print head)?</li>
              <li><strong>Cover:</strong> Is the printer cover closed tightly?</li>
              <li><strong>Cables:</strong> Ethernet cable connected and LED blinking?</li>
            </ol>
          </div>

          {/* Last Resort Options */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🆘 If NOTHING Works:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Factory Reset:</strong> Reset printer to default settings</li>
              <li><strong>Firmware Update:</strong> Check Star Micronics website for updates</li>
              <li><strong>Different Paper:</strong> Try a different roll of thermal paper</li>
              <li><strong>USB Test:</strong> Connect via USB and test with Star's software</li>
              <li><strong>Network Reset:</strong> Reset network settings and reconfigure IP</li>
              <li><strong>Hardware Issue:</strong> Print head might be faulty</li>
            </ul>
          </div>

          {/* Success Criteria */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">✅ Success Indicators:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Paper Movement:</strong> Paper advances and cuts</li>
              <li><strong>Text Output:</strong> Black text appears on paper</li>
              <li><strong>HTTP Response:</strong> Printer returns success status</li>
              <li><strong>Network Activity:</strong> Printer LED shows activity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
