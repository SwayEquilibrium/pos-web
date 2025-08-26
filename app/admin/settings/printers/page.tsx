'use client'

import { useState, useEffect } from 'react'
import { flags } from '@/src/config/flags'
import { useRooms } from '@/hooks/useRoomsTables'
import { useCategories } from '@/hooks/useCatalog'

interface PrinterConfig {
  id: string
  name: string
  displayName: string // Friendly name to show in UI
  type: 'CloudPRNT' | 'WebPRNT'
  ip: string
  status: 'connected' | 'disconnected' | 'unknown'
  assignedRooms: string[]
  assignedCategories: string[]
  isDefault: boolean
}

export default function PrintersSettingsPage() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([
    {
      id: 'tsp100-kitchen',
      name: 'tsp100-kitchen',
      displayName: 'Kitchen Printer (TSP100)',
      type: 'CloudPRNT',
      ip: '192.168.8.197',
      status: 'connected',
      assignedRooms: [],
      assignedCategories: [],
      isDefault: true
    }
  ])
  
  const [mounted, setMounted] = useState(false)
  const [testResults, setTestResults] = useState<{[key: string]: string}>({})
  
  // Get real data from database
  const { data: rooms } = useRooms()
  const { data: categories } = useCategories()

  useEffect(() => {
    setMounted(true)
  }, [])

  const testPrinter = async (printerId: string) => {
    setTestResults(prev => ({ ...prev, [printerId]: 'Testing...' }))
    
    try {
      if (flags.printerCloudPRNTV1) {
        // Test CloudPRNT
        const { buildESCPOSTestReceipt } = await import('@/proposals/ext/modkit/printers/receipts/escposReceipt.v1')
        const testReceipt = buildESCPOSTestReceipt()
        
        const response = await fetch('/api/cloudprnt/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerId: printerId,
            payload: testReceipt,
            contentType: 'application/vnd.star.starprnt',
            orderId: null,
            receiptType: 'test'
          })
        })

        if (response.ok) {
          setTestResults(prev => ({ ...prev, [printerId]: 'Test sent! Check printer for output.' }))
          
          // Update printer status
          setPrinters(prev => prev.map(p => 
            p.id === printerId ? { ...p, status: 'connected' as const } : p
          ))
        } else {
          setTestResults(prev => ({ ...prev, [printerId]: 'Test failed: ' + response.statusText }))
        }
      } else {
        setTestResults(prev => ({ ...prev, [printerId]: 'CloudPRNT not enabled in feature flags' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [printerId]: 'Error: ' + error }))
    }
  }

  const addNewPrinter = () => {
    const newPrinter: PrinterConfig = {
      id: `printer-${Date.now()}`,
      name: `printer-${Date.now()}`,
      displayName: 'New Printer',
      type: 'CloudPRNT',
      ip: '192.168.8.xxx',
      status: 'unknown',
      assignedRooms: [],
      assignedCategories: [],
      isDefault: false
    }
    setPrinters(prev => [...prev, newPrinter])
  }

  const updatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
    setPrinters(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ))
  }

  const deletePrinter = (id: string) => {
    setPrinters(prev => prev.filter(p => p.id !== id))
  }

  // Use real data from database
  const availableRooms = rooms?.map(room => ({ id: room.id, name: room.name })) || []
  const availableCategories = categories?.map(cat => ({ id: cat.id, name: cat.name })) || []

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🖨️ Printer Management
          </h1>
          <button
            onClick={addNewPrinter}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Printer
          </button>
        </div>

        {/* Feature Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🚩 Feature Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">CloudPRNT:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                flags.printerCloudPRNTV1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {flags.printerCloudPRNTV1 ? '✅ ENABLED' : '❌ DISABLED'}
              </span>
            </div>
            <div>
              <span className="font-medium">WebPRNT:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                flags.printerWebPRNTV1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {flags.printerWebPRNTV1 ? '✅ ENABLED' : '⚪ DISABLED'}
              </span>
            </div>
          </div>
        </div>

        {/* Printers List */}
        <div className="space-y-6">
          {printers.map(printer => (
            <div key={printer.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <input
                      type="text"
                      value={printer.displayName}
                      onChange={(e) => updatePrinter(printer.id, { displayName: e.target.value })}
                      className="text-xl font-semibold border-none bg-transparent focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    />
                    <div className="text-sm text-gray-500">
                      ID: {printer.name}
                    </div>
                    {printer.isDefault && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        DEFAULT
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      printer.status === 'connected' ? 'bg-green-100 text-green-800' :
                      printer.status === 'disconnected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {printer.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={printer.type}
                        onChange={(e) => updatePrinter(printer.id, { type: e.target.value as 'CloudPRNT' | 'WebPRNT' })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="CloudPRNT">CloudPRNT</option>
                        <option value="WebPRNT">WebPRNT</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP Address
                      </label>
                      <input
                        type="text"
                        value={printer.ip}
                        onChange={(e) => updatePrinter(printer.id, { ip: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="192.168.8.xxx"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => testPrinter(printer.id)}
                    className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
                  >
                    Test Print
                  </button>
                  <button
                    onClick={() => deletePrinter(printer.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Test Results */}
              {testResults[printer.id] && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
                  <strong>Test Result:</strong> {testResults[printer.id]}
                </div>
              )}

              {/* Room Assignment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Rooms
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableRooms.map(room => (
                    <label key={room.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printer.assignedRooms.includes(room.id)}
                        onChange={(e) => {
                          const rooms = e.target.checked
                            ? [...printer.assignedRooms, room.id]
                            : printer.assignedRooms.filter(r => r !== room.id)
                          updatePrinter(printer.id, { assignedRooms: rooms })
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{room.name}</span>
                    </label>
                  ))}
                </div>
                {availableRooms.length === 0 && (
                  <p className="text-gray-500 text-sm">No rooms found. Create rooms in Table Management.</p>
                )}
              </div>

              {/* Category Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Product Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printer.assignedCategories.includes(category.id)}
                        onChange={(e) => {
                          const categories = e.target.checked
                            ? [...printer.assignedCategories, category.id]
                            : printer.assignedCategories.filter(c => c !== category.id)
                          updatePrinter(printer.id, { assignedCategories: categories })
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
                {availableCategories.length === 0 && (
                  <p className="text-gray-500 text-sm">No categories found. Create categories in Menu Editor.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            🔧 Printer Configuration Instructions
          </h2>
          <div className="space-y-4 text-blue-700">
            <div>
              <strong>For CloudPRNT printers (TSP100):</strong>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li>Access printer web interface: <code className="bg-blue-100 px-1 rounded">http://[PRINTER_IP]</code></li>
                <li>Navigate to: Network → CloudPRNT</li>
                <li>Enable CloudPRNT</li>
                <li>Set Server URL: <code className="bg-blue-100 px-1 rounded">http://192.168.8.164:3000/api/cloudprnt/[PRINTER_ID]/job</code></li>
                <li>Set Poll Interval: 10 seconds</li>
                <li>Save settings and restart printer</li>
              </ol>
            </div>
            
            <div>
              <strong>For WebPRNT printers (mC-Print2):</strong>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li>Access printer web interface</li>
                <li>Navigate to: Network → WebPRNT</li>
                <li>Enable WebPRNT</li>
                <li>No additional server configuration needed</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
