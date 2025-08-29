'use client'

import { useState } from 'react'
import { usePrinters, useTestPrinter, useCreatePrinter, useUpdatePrinter, useDeletePrinter } from '@/hooks/usePrinters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PrinterSettingsPage() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    connection_string: '',
    paper_width: 48,
    print_kitchen_receipts: true,
    print_customer_receipts: false,
    auto_print_on_order: true,
    auto_print_on_payment: false
  })

  // Queries
  const { data: printers, isLoading: printersLoading } = usePrinters()

  // Mutations
  const testPrinter = useTestPrinter()
  const createPrinter = useCreatePrinter()
  const updatePrinter = useUpdatePrinter()
  const deletePrinter = useDeletePrinter()

  const handleSelectPrinter = (printer: any) => {
    setSelectedPrinterId(printer.id)
    setIsCreating(false)
    setFormData({
      name: printer.name,
      display_name: printer.display_name,
      connection_string: printer.connection_string,
      paper_width: printer.paper_width,
      print_kitchen_receipts: printer.print_kitchen_receipts,
      print_customer_receipts: printer.print_customer_receipts,
      auto_print_on_order: printer.auto_print_on_order,
      auto_print_on_payment: printer.auto_print_on_payment
    })
  }

  const handleCreateNew = () => {
    setSelectedPrinterId(null)
    setIsCreating(true)
    setFormData({
      name: '',
      display_name: '',
      connection_string: '',
      paper_width: 48,
      print_kitchen_receipts: true,
      print_customer_receipts: false,
      auto_print_on_order: true,
      auto_print_on_payment: false
    })
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        // Create new printer
        const apiData = {
          name: formData.name,
          connection_string: formData.connection_string
        }
        
        await createPrinter.mutateAsync(apiData)
        alert('Printer created successfully! ✅')
        setIsCreating(false)
      } else if (selectedPrinterId) {
        // Update existing printer
        await updatePrinter.mutateAsync({ 
          id: selectedPrinterId, 
          updates: formData 
        })
        alert('Printer updated successfully! ✅')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert(`Failed to save printer: ${error}`)
    }
  }

  const handleTest = async (printerId: string) => {
    try {
      await testPrinter.mutateAsync(printerId)
      alert('✅ Test completed successfully!')
    } catch (error) {
      alert(`Test failed: ${error}`)
    }
  }

  const handleDelete = async (printerId: string) => {
    if (confirm('Are you sure you want to delete this printer?')) {
      try {
        await deletePrinter.mutateAsync(printerId)
        setSelectedPrinterId(null)
        setIsCreating(false)
        alert('Printer deleted successfully! ✅')
      } catch (error) {
        alert(`Failed to delete printer: ${error}`)
      }
    }
  }

  const getStatusBadge = (printer: any) => {
    if (printer.last_test_result === 'success') {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>
    } else if (printer.last_test_result?.startsWith('failed')) {
      return <Badge variant="destructive">Failed</Badge>
    } else if (printer.last_test_result?.startsWith('error')) {
      return <Badge variant="destructive">Error</Badge>
    } else {
      return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (printersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🖨️ Printer Settings</h1>
          <p className="text-muted-foreground">Configure your printers for receipts and orders</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
          ➕ Add Printer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Printer List */}
        <Card>
          <CardHeader>
            <CardTitle>Printers ({printers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {printers?.map((printer) => (
              <div
                key={printer.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPrinterId === printer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectPrinter(printer)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{printer.display_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {printer.brand} {printer.printer_type} • {printer.connection_string}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(printer)}
                      {printer.print_kitchen_receipts && (
                        <Badge variant="outline">Kitchen</Badge>
                      )}
                      {printer.print_customer_receipts && (
                        <Badge variant="outline">Customer</Badge>
                      )}
                      {printer.is_default && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTest(printer.id)
                      }}
                      disabled={testPrinter.isPending}
                    >
                      🧪 Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!printers || printers.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No printers configured yet.</p>
                <p className="text-sm">Click "Add Printer" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? '➕ New Printer' : selectedPrinterId ? '⚙️ Printer Configuration' : '📋 Select a Printer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isCreating || selectedPrinterId) ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., tsp100-kitchen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name *</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Kitchen Printer (TSP100)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">IP Address *</label>
                  <input
                    type="text"
                    value={formData.connection_string}
                    onChange={(e) => setFormData(prev => ({ ...prev, connection_string: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., 192.168.8.192"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the IP address of your network printer
                  </p>
                </div>

                {/* Paper Width */}
                <div>
                  <label className="block text-sm font-medium mb-2">Paper Width (characters)</label>
                  <input
                    type="number"
                    value={formData.paper_width}
                    onChange={(e) => setFormData(prev => ({ ...prev, paper_width: parseInt(e.target.value) || 48 }))}
                    className="w-full p-2 border rounded-md"
                    min="20"
                    max="80"
                  />
                </div>

                {/* Printing Behavior */}
                <div className="space-y-3">
                  <h4 className="font-medium">Printing Behavior</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.print_kitchen_receipts}
                        onChange={(e) => setFormData(prev => ({ ...prev, print_kitchen_receipts: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Print Kitchen Orders</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.print_customer_receipts}
                        onChange={(e) => setFormData(prev => ({ ...prev, print_customer_receipts: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Print Customer Receipts</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_print_on_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_print_on_order: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Auto-print on Order</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_print_on_payment}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_print_on_payment: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Auto-print on Payment</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={createPrinter.isPending || updatePrinter.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createPrinter.isPending || updatePrinter.isPending ? 'Saving...' : '💾 Save'}
                  </Button>
                  
                  {selectedPrinterId && (
                    <Button
                      variant="outline"
                      onClick={() => handleTest(selectedPrinterId)}
                      disabled={testPrinter.isPending}
                    >
                      {testPrinter.isPending ? 'Testing...' : '🧪 Test Print'}
                    </Button>
                  )}
                  
                  {selectedPrinterId && !isCreating && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedPrinterId)}
                      disabled={deletePrinter.isPending}
                    >
                      {deletePrinter.isPending ? 'Deleting...' : '🗑️ Delete'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setSelectedPrinterId(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a printer from the list to configure it,</p>
                <p>or click "Add Printer" to create a new one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Simple Printer Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">✅ What You Need</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Network printer (Star TSP100, Epson, etc.)</li>
                <li>• Printer connected to same network</li>
                <li>• Printer's IP address</li>
                <li>• Basic printer settings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔧 Setup Steps</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>1. Connect printer to network</li>
                <li>2. Find printer's IP address</li>
                <li>3. Add printer with IP address</li>
                <li>4. Configure printing behavior</li>
                <li>5. Test the connection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
