'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DirectTSP100Test() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDirectPrint = async () => {
    setLoading(true)
    setMessage('Testing direct print to TSP100...')

    try {
      // TSP100 specific ESC/POS commands
      const printCommands = [
        '\x1B\x40',        // ESC @ - Initialize printer
        '\x1B\x61\x01',    // ESC a 1 - Center alignment
        '\x1B\x45\x01',    // ESC E 1 - Bold ON
        '*** TSP100 DIRECT TEST ***\n',
        '\x1B\x45\x00',    // ESC E 0 - Bold OFF
        '\x1B\x61\x00',    // ESC a 0 - Left alignment
        '\n',
        'DIRECT PRINT TEST\n',
        '=================\n',
        '\n',
        `Time: ${new Date().toLocaleString()}\n`,
        'Method: Direct ESC/POS\n',
        'Printer: Star TSP100\n',
        'IP: 192.168.8.197\n',
        '\n',
        'This bypasses all web protocols!\n',
        'If you see this, your printer works!\n',
        '\n',
        '=================\n',
        '\x1B\x64\x03',     // ESC d 3 - Feed 3 lines
        '\x1B\x6D',        // ESC m - Partial cut
      ].join('')

      // Convert to bytes for proper transmission
      const encoder = new TextEncoder()
      const data = encoder.encode(printCommands)

      // Try multiple methods to send data
      const methods = [
        { name: 'POST to root', url: 'http://192.168.8.197/', method: 'POST' },
        { name: 'POST to print', url: 'http://192.168.8.197/print', method: 'POST' },
        { name: 'PUT to root', url: 'http://192.168.8.197/', method: 'PUT' },
      ]

      let success = false
      let results = []

      for (const method of methods) {
        try {
          const response = await fetch(method.url, {
            method: method.method,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: data,
            mode: 'no-cors', // Bypass CORS for direct printer communication
            signal: AbortSignal.timeout(10000)
          })

          results.push(`${method.name}: Sent (no-cors mode)`)
          success = true
        } catch (error) {
          results.push(`${method.name}: ${error}`)
        }
      }

      if (success) {
        setMessage(`✅ Direct print commands sent!\n\n${results.join('\n')}\n\n🖨️ Check your printer for output!\n\nIf nothing printed, it's likely a paper or hardware issue.`)
      } else {
        setMessage(`❌ All direct print methods failed:\n\n${results.join('\n')}`)
      }

    } catch (error) {
      setMessage(`❌ Direct print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleText = async () => {
    setLoading(true)
    setMessage('Sending simple text...')

    try {
      const simpleText = `
TSP100 SIMPLE TEST
==================

Hello from your POS system!

Time: ${new Date().toLocaleString()}
This is the simplest possible test.

If you see this text, your printer is working!

==================


`

      const response = await fetch('http://192.168.8.197/', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: simpleText,
        mode: 'no-cors',
        signal: AbortSignal.timeout(10000)
      })

      setMessage(`✅ Simple text sent!\n\n🖨️ Check your printer now!\n\nIf nothing appears, the issue is:\n- Wrong paper type (needs thermal paper)\n- Paper upside down (shiny side down)\n- Print head not making contact`)

    } catch (error) {
      setMessage(`❌ Simple text failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testPaperFeed = async () => {
    setLoading(true)
    setMessage('Testing paper feed...')

    try {
      // Just send paper feed commands
      const feedCommands = [
        '\x1B\x40',        // Initialize
        '\x1B\x64\x10',    // Feed 16 lines (should be visible)
        '\x1B\x6D',        // Partial cut
      ].join('')

      const encoder = new TextEncoder()
      const data = encoder.encode(feedCommands)

      await fetch('http://192.168.8.197/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: data,
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })

      setMessage(`✅ Paper feed command sent!\n\n🖨️ Did the paper advance and cut?\n\nIf YES: Printer hardware works, but text isn't printing\nIf NO: Check power, paper loading, or printer settings`)

    } catch (error) {
      setMessage(`❌ Paper feed failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>🎯 Direct TSP100 Communication</CardTitle>
          <CardDescription>
            Bypass all web protocols - send commands directly to your TSP100
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Update */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium mb-2">✅ Progress Update:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ <strong>Network:</strong> Printer is reachable and responding</li>
              <li>✅ <strong>Web Server:</strong> Printer has active HTTP server</li>
              <li>❌ <strong>WebPRNT:</strong> Not supported (404 error is expected)</li>
              <li>🎯 <strong>Next:</strong> Try direct ESC/POS commands</li>
            </ul>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={testPaperFeed} 
              disabled={loading}
              variant="outline"
              className="h-16"
            >
              {loading ? 'Testing...' : '1. Test Paper Feed Only'}
              <div className="text-xs text-gray-600 mt-1">
                Just advance paper - no text
              </div>
            </Button>
            
            <Button 
              onClick={testSimpleText} 
              disabled={loading}
              variant="outline"
              className="h-16"
            >
              {loading ? 'Testing...' : '2. Simple Text Print'}
              <div className="text-xs text-gray-600 mt-1">
                Plain text without special commands
              </div>
            </Button>
            
            <Button 
              onClick={testDirectPrint} 
              disabled={loading}
              className="h-16 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Testing...' : '3. Direct ESC/POS Print'}
              <div className="text-xs text-blue-100 mt-1">
                Full ESC/POS commands with formatting
              </div>
            </Button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Physical Diagnosis */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🔍 What Each Test Tells Us:</h3>
            <div className="text-sm space-y-2">
              <div><strong>Paper Feed Test:</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>If paper advances: Hardware and power OK</li>
                <li>If no movement: Check power, paper loading, or mechanical issue</li>
              </ul>
              
              <div><strong>Simple Text Test:</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>If text prints: Everything works!</li>
                <li>If paper feeds but no text: Wrong paper type or orientation</li>
              </ul>
              
              <div><strong>ESC/POS Test:</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Professional printer commands with formatting</li>
                <li>Should print bold headers and cut paper</li>
              </ul>
            </div>
          </div>

          {/* Paper Reminder */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-medium mb-2">🚨 CRITICAL: Paper Check</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Thermal Paper Only:</strong> Regular paper won't work</li>
              <li><strong>Scratch Test:</strong> Fingernail should leave black mark on thermal paper</li>
              <li><strong>Orientation:</strong> Shiny/smooth side faces DOWN (towards print head)</li>
              <li><strong>Loading:</strong> Paper should feed smoothly when you press FEED button</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
