'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CloudPRNTSetup() {
  const [printerId, setPrinterId] = useState('tsp100-kitchen')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [queueStats, setQueueStats] = useState<any>(null)

  const testCloudPRNT = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Test enqueue
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId,
          payload: `*** CLOUDPRNT TEST ***

Kitchen Order #${Math.floor(Math.random() * 1000)}

2x Grilled Chicken
  - No mayo
  - Extra pickles

1x French Fries
  - Extra crispy  

2x Coca Cola

Time: ${new Date().toLocaleString()}

*** CloudPRNT Working! ***


`,
          contentType: 'text/plain',
          receiptType: 'test'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ Job enqueued successfully!\n\nJob ID: ${result.jobId}\nPrinter: ${printerId}\n\n🖨️ Now configure your printer to poll:\nhttp://localhost:3000/api/cloudprnt/${printerId}/job`)
        fetchQueueStatus()
      } else {
        setMessage(`❌ Failed: ${result.error}`)
      }

    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`/api/cloudprnt/enqueue?printerId=${printerId}`)
      const data = await response.json()
      setJobs(data.jobs || [])
      setQueueStats(data.summary || {})
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    }
  }

  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [printerId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800'
      case 'DELIVERED': return 'bg-blue-100 text-blue-800'
      case 'PRINTED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>☁️ CloudPRNT Setup - The Easy Way</CardTitle>
          <CardDescription>
            CloudPRNT is much more reliable than WebPRNT. Let's get it working!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Why CloudPRNT */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium mb-2">✅ Why CloudPRNT is Better:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>More Reliable:</strong> Printer polls server instead of direct HTTP</li>
              <li><strong>Queue System:</strong> Jobs won't be lost if printer is busy</li>
              <li><strong>No CORS Issues:</strong> Printer makes outbound requests</li>
              <li><strong>Status Tracking:</strong> See if jobs are queued/delivered/printed</li>
              <li><strong>Works Through NAT:</strong> No network configuration needed</li>
            </ul>
          </div>

          {/* Step 1: Test the System */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Step 1: Test CloudPRNT System</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="printer-id">Printer ID</Label>
                  <Input
                    id="printer-id"
                    value={printerId}
                    onChange={(e) => setPrinterId(e.target.value)}
                    placeholder="tsp100-kitchen"
                  />
                </div>
                <Button onClick={testCloudPRNT} disabled={loading}>
                  {loading ? 'Testing...' : '📤 Test CloudPRNT'}
                </Button>
              </div>
              
              {message && (
                <div className={`p-3 rounded text-sm whitespace-pre-line ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Configure Printer */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Step 2: Configure Your TSP100</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium mb-2">Printer Configuration:</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Open <strong>http://192.168.8.197</strong> in your browser</li>
                  <li>Login (try admin/admin or no login)</li>
                  <li>Look for <strong>"CloudPRNT"</strong> settings</li>
                  <li>Enable CloudPRNT</li>
                  <li>Set Server URL: <code className="bg-white px-1 rounded">http://localhost:3000/api/cloudprnt/{printerId}/job</code></li>
                  <li>Set Poll Interval: <strong>10 seconds</strong></li>
                  <li>Save and restart printer</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded">
                <h4 className="font-medium mb-2">⚠️ Important URLs:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Server URL:</strong> <code>http://localhost:3000/api/cloudprnt/{printerId}/job</code></div>
                  <div><strong>Status Callback:</strong> <code>http://localhost:3000/api/cloudprnt/{printerId}/job</code> (optional)</div>
                  <div><strong>Replace {printerId} with:</strong> <code>{printerId}</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Monitor Queue */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Step 3: Monitor Print Queue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Queue Statistics</h4>
                {queueStats ? (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div>Total jobs (24h): {queueStats.total || 0}</div>
                    {queueStats.byStatus && Object.entries(queueStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between">
                        <span>{status}:</span>
                        <span>{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No statistics available</div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Jobs</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {jobs.length === 0 ? (
                    <div className="text-sm text-gray-500">No jobs yet</div>
                  ) : (
                    jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="text-sm p-2 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{job.printer_id}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🎯 What Should Happen:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><strong>Test CloudPRNT:</strong> Job appears as QUEUED</li>
              <li><strong>Configure Printer:</strong> Set CloudPRNT URL in printer settings</li>
              <li><strong>Printer Polls:</strong> Every 10 seconds, printer checks for jobs</li>
              <li><strong>Job Delivered:</strong> Status changes from QUEUED → DELIVERED</li>
              <li><strong>Printer Prints:</strong> Physical receipt comes out</li>
              <li><strong>Status Update:</strong> Status changes to PRINTED (if callback enabled)</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🔧 If Jobs Stay QUEUED:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Printer is not polling (check CloudPRNT settings)</li>
              <li>Wrong Server URL in printer</li>
              <li>CloudPRNT not enabled in printer</li>
              <li>Network connectivity issue</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🎉 If Jobs Become DELIVERED but Don't Print:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>CloudPRNT is working! The issue is hardware/paper</li>
              <li>Check thermal paper type and orientation</li>
              <li>Ensure printer cover is closed properly</li>
              <li>Test paper feed with FEED button</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
