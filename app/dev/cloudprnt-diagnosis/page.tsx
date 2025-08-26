'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CloudPRNTDiagnosis() {
  const [results, setResults] = useState<string[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [monitoring, setMonitoring] = useState(false)

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/cloudprnt/enqueue?printerId=tsp100-kitchen')
      const data = await response.json()
      setJobs(data.jobs || [])
      return data.jobs || []
    } catch (error) {
      addResult(`❌ Error fetching jobs: ${error}`)
      return []
    }
  }

  const runFullDiagnosis = async () => {
    setResults([])
    addResult('🔍 Starting comprehensive CloudPRNT diagnosis...')

    // Test 1: Create a test job
    addResult('📤 Step 1: Creating test job...')
    try {
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: `*** DIAGNOSIS TEST ***

Time: ${new Date().toLocaleString()}
Test ID: ${Math.random().toString(36).substring(7)}

If you see this, CloudPRNT is working!

*** END TEST ***


`,
          receiptType: 'diagnosis'
        }),
      })

      const result = await response.json()
      if (response.ok) {
        addResult(`✅ Test job created: ${result.jobId}`)
      } else {
        addResult(`❌ Failed to create job: ${result.error}`)
        return
      }
    } catch (error) {
      addResult(`❌ Job creation failed: ${error}`)
      return
    }

    // Test 2: Check initial job status
    addResult('📊 Step 2: Checking initial job status...')
    let currentJobs = await fetchJobs()
    const queuedJobs = currentJobs.filter(j => j.status === 'QUEUED')
    const deliveredJobs = currentJobs.filter(j => j.status === 'DELIVERED')
    
    addResult(`   QUEUED: ${queuedJobs.length}`)
    addResult(`   DELIVERED: ${deliveredJobs.length}`)

    if (queuedJobs.length === 0) {
      addResult('⚠️ No queued jobs found - something is wrong')
      return
    }

    // Test 3: Monitor for changes
    addResult('⏱️ Step 3: Monitoring for 60 seconds...')
    addResult('   (Printer should poll every 10 seconds)')

    const startTime = Date.now()
    const monitorInterval = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      currentJobs = await fetchJobs()
      const newQueued = currentJobs.filter(j => j.status === 'QUEUED').length
      const newDelivered = currentJobs.filter(j => j.status === 'DELIVERED').length
      
      addResult(`   ${elapsed}s: QUEUED=${newQueued}, DELIVERED=${newDelivered}`)

      if (newDelivered > deliveredJobs.length) {
        addResult('🎉 SUCCESS! Job status changed to DELIVERED!')
        addResult('✅ Printer IS polling the server!')
        addResult('💡 If no physical printing: Check paper type/orientation')
        clearInterval(monitorInterval)
        setMonitoring(false)
      }

      if (elapsed >= 60) {
        addResult('⏰ 60 seconds elapsed - stopping monitor')
        addResult('❌ No job status changes detected')
        addResult('💡 Printer is NOT polling the server')
        clearInterval(monitorInterval)
        setMonitoring(false)
      }
    }, 10000) // Check every 10 seconds

    setMonitoring(true)
  }

  const testServerReachability = async () => {
    addResult('🔍 Testing if printer can reach our server...')

    const testUrls = [
      'http://localhost:3000/api/cloudprnt/tsp100-kitchen/job',
      'http://192.168.8.164:3000/api/cloudprnt/tsp100-kitchen/job',
      `http://${window.location.hostname}:3000/api/cloudprnt/tsp100-kitchen/job`
    ]

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })
        
        if (response.status === 204) {
          addResult(`✅ ${url} - Working (204 No Content)`)
        } else if (response.status === 404) {
          addResult(`❌ ${url} - Not found (404)`)
        } else {
          addResult(`⚠️ ${url} - Status ${response.status}`)
        }
      } catch (error) {
        addResult(`❌ ${url} - Failed: ${error}`)
      }
    }

    addResult('💡 Try the working URL in your printer CloudPRNT settings')
  }

  const checkNetworkConnectivity = async () => {
    addResult('🌐 Testing network connectivity from browser to printer...')

    try {
      const response = await fetch('http://192.168.8.197', {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })
      addResult('✅ Can reach printer web interface from browser')
    } catch (error) {
      addResult(`❌ Cannot reach printer: ${error}`)
    }

    addResult('💡 The printer needs to reach YOUR computer on port 3000')
    addResult(`💡 Your computer IP: ${window.location.hostname}`)
    addResult('💡 Make sure Windows Firewall allows port 3000')
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔬 CloudPRNT Diagnosis - Let's Find the Issue</CardTitle>
          <CardDescription>
            Comprehensive testing to figure out why your printer isn't polling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium mb-2">Current Queue Status</h3>
              <div className="text-sm space-y-1">
                <div>Total jobs: {jobs.length}</div>
                <div>QUEUED: {jobs.filter(j => j.status === 'QUEUED').length}</div>
                <div>DELIVERED: {jobs.filter(j => j.status === 'DELIVERED').length}</div>
                <div>PRINTED: {jobs.filter(j => j.status === 'PRINTED').length}</div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-medium mb-2">Expected Behavior</h3>
              <div className="text-sm space-y-1">
                <div>• Printer polls every 10 seconds</div>
                <div>• Jobs move QUEUED → DELIVERED</div>
                <div>• Physical printing occurs</div>
                <div>• Status may update to PRINTED</div>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={runFullDiagnosis} 
              disabled={monitoring}
              className="h-20"
            >
              {monitoring ? 'Monitoring...' : '🔬 Full Diagnosis'}
              <div className="text-xs mt-1">
                Create job and monitor for changes
              </div>
            </Button>
            
            <Button 
              onClick={testServerReachability} 
              variant="outline"
              className="h-20"
            >
              🌐 Test Server URLs
              <div className="text-xs text-gray-600 mt-1">
                Check if our API is reachable
              </div>
            </Button>
            
            <Button 
              onClick={checkNetworkConnectivity} 
              variant="outline"
              className="h-20"
            >
              🔗 Network Test
              <div className="text-xs text-gray-600 mt-1">
                Check printer-to-server connectivity
              </div>
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white">Diagnosis Results:</h3>
                <Button 
                  onClick={() => setResults([])} 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-gray-800"
                >
                  Clear
                </Button>
              </div>
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}

          {/* Recent Jobs */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">Recent Jobs (Auto-refreshing)</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="text-sm text-gray-500">No jobs in queue</div>
              ) : (
                jobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="text-sm p-2 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{job.printer_id}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'DELIVERED' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'PRINTED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Created: {new Date(job.created_at).toLocaleString()}
                      {job.delivered_at && (
                        <span className="ml-2">
                          Delivered: {new Date(job.delivered_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🚨 Common Issues When Jobs Stay QUEUED:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Wrong Server URL:</strong> Printer can't reach your computer</li>
              <li><strong>Firewall Blocking:</strong> Windows Firewall blocks port 3000</li>
              <li><strong>Network Issues:</strong> Printer and computer on different subnets</li>
              <li><strong>CloudPRNT Not Saved:</strong> Settings not properly applied in printer</li>
              <li><strong>Printer Restart Needed:</strong> Changes require printer reboot</li>
              <li><strong>Wrong IP Address:</strong> Using localhost instead of actual IP</li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">🎯 Next Steps Based on Results:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>If jobs never change status:</strong> Printer not polling - check URL and firewall</li>
              <li><strong>If jobs become DELIVERED:</strong> CloudPRNT works! Check paper/hardware</li>
              <li><strong>If server URLs fail:</strong> Try different IP addresses or check firewall</li>
              <li><strong>If network tests fail:</strong> Check printer and computer are on same network</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
