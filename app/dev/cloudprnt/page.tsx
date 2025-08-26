'use client'

import { useState, useEffect } from 'react'
import { flags } from '@/src/config/flags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea' // Not available, using regular textarea
import { Badge } from '@/components/ui/badge'

interface PrintJob {
  id: string
  printer_id: string
  status: string
  content_type: string
  created_at: string
  delivered_at?: string
  printed_at?: string
  receipt_type?: string
}

export default function CloudPRNTTestPage() {
  const [printerId, setPrinterId] = useState('tsp100-kitchen')
  const [payload, setPayload] = useState(`*** CLOUDPRNT TEST ***

Kitchen Order #${Math.floor(Math.random() * 1000)}

2x Grilled Chicken Sandwich
  - No mayo
  - Extra pickles

1x French Fries
  - Extra crispy

2x Coca Cola

Time: ${new Date().toLocaleString()}
Printer: TSP100 CloudPRNT

*** END ORDER ***`)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [queueStats, setQueueStats] = useState<any>(null)

  // Feature flag check
  if (!flags.printerCloudPRNTV1) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>🖨️ CloudPRNT Test - Disabled</CardTitle>
            <CardDescription>
              The CloudPRNT feature is currently disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To enable CloudPRNT:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add <code>printerCloudPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code> environment variable</li>
                <li>Run the database migration from <code>proposals/migrations/010_cloudprnt.sql</code></li>
                <li>Configure your printer with the CloudPRNT server URL</li>
                <li>Restart your development server</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const enqueueJob = async () => {
    setLoading(true)
    setMessage('')

    try {
      console.log('🔍 Debug - Feature flags:', { 
        printerCloudPRNTV1: flags.printerCloudPRNTV1,
        allFlags: flags 
      })
      console.log('🔍 Debug - Environment flags:', process.env.NEXT_PUBLIC_FLAGS)

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId,
          payload,
          contentType: 'text/plain',
          receiptType: 'test'
        }),
      })

      console.log('🔍 Debug - Response status:', response.status)
      console.log('🔍 Debug - Response headers:', Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log('🔍 Debug - Raw response:', responseText.substring(0, 500))

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`)
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      setMessage(`✅ Job enqueued successfully!\n\nJob ID: ${result.jobId}\nStatus: ${result.status}\n\n🖨️ Your printer should poll and print this within 10 seconds.`)
      
      // Refresh queue status
      await fetchQueueStatus()

    } catch (error) {
      console.error('❌ Failed to enqueue job:', error)
      setMessage(`❌ Failed to enqueue job: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`/api/cloudprnt/enqueue?printerId=${printerId}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
        setQueueStats(data.summary || {})
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    }
  }

  useEffect(() => {
    fetchQueueStatus()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [printerId])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'QUEUED': 'default',
      'DELIVERED': 'secondary', 
      'PRINTED': 'success',
      'FAILED': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🖨️ Star CloudPRNT Test</CardTitle>
          <CardDescription>
            Test CloudPRNT printing by enqueuing jobs and monitoring the queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span className="font-medium">CloudPRNT Enabled</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              Jobs will be queued and delivered to printers via polling
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Debug: Flag = {flags.printerCloudPRNTV1 ? 'TRUE' : 'FALSE'}, Env = {process.env.NEXT_PUBLIC_FLAGS || 'undefined'}
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="printer-id">Printer ID</Label>
                <Input
                  id="printer-id"
                  value={printerId}
                  onChange={(e) => setPrinterId(e.target.value)}
                  placeholder="tsp100-kitchen"
                />
                <div className="text-xs text-gray-600">
                  This should match your printer's CloudPRNT configuration
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload">Print Content</Label>
                <textarea
                  id="payload"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  rows={12}
                  className="font-mono text-sm w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              <Button 
                onClick={enqueueJob} 
                disabled={loading || !printerId || !payload}
                className="w-full"
              >
                {loading ? 'Enqueuing...' : '📤 Enqueue Print Job'}
              </Button>
            </div>

            {/* Queue Status */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Queue Statistics</h3>
                {queueStats ? (
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <div>Total jobs (24h): {queueStats.total || 0}</div>
                    {queueStats.byStatus && Object.entries(queueStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between">
                        <span>{status}:</span>
                        <span>{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Loading...</div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Recent Jobs</h3>
                  <Button onClick={fetchQueueStatus} variant="outline" size="sm">
                    🔄 Refresh
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {jobs.length === 0 ? (
                    <div className="text-sm text-gray-500">No jobs found</div>
                  ) : (
                    jobs.slice(0, 10).map((job) => (
                      <div key={job.id} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{job.printer_id}</span>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                        {job.delivered_at && (
                          <div className="text-xs text-green-600">
                            Delivered: {new Date(job.delivered_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">How CloudPRNT Works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Enqueue Print Job" to add a job to the queue</li>
              <li>Your printer polls the server every 10 seconds</li>
              <li>Server delivers the oldest queued job to the printer</li>
              <li>Printer processes the job and prints the content</li>
              <li>Job status updates from QUEUED → DELIVERED → PRINTED</li>
            </ol>
          </div>

          {/* Printer Configuration */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Printer Configuration Required:</h3>
            <div className="text-sm space-y-2">
              <p>Configure your TSP100 with these CloudPRNT settings:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Server URL:</strong> <code>http://192.168.8.164:3000/api/cloudprnt/{printerId}/job</code></li>
                <li><strong>Poll Interval:</strong> 10 seconds</li>
                <li><strong>Status Callback:</strong> <code>http://192.168.8.164:3000/api/cloudprnt/{printerId}/job</code></li>
                <li><strong>Authentication:</strong> None</li>
              </ul>
              <p className="text-yellow-700 mt-2">
                <strong>Note:</strong> Access your printer web interface at http://192.168.8.197 to configure CloudPRNT settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
