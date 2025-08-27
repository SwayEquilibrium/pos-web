'use client'

import { useState } from 'react'
import { usePrinters, usePrinterConfig, useTestPrinter, useCreatePrinter, useUpdatePrinter, useDeletePrinter } from '@/hooks/usePrinters'
import { useRooms } from '@/hooks/useRoomsTables'
import { useProductTypes } from '@/hooks/useProductTypes'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Simple cut commands - using your working one as default
const CUT_COMMANDS = {
  '1B6401': { name: 'ESC d 1 (Partial Cut)', description: 'TESTED WORKING with TSP100', tested_working: true },
  '1B6403': { name: 'ESC d 3 (Feed + Cut)', description: 'Feed lines then partial cut', tested_working: false },
  '1D564200': { name: 'GS V 66 0 (Standard)', description: 'Standard GS partial cut', tested_working: false }
}

export default function PrinterSettingsPage() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    printer_type: 'CloudPRNT',
    brand: 'Star',
    connection_string: 'auto-detect', // Will be automatic in production
    paper_width: 48,
    supports_cut: true,
    cut_command_hex: '1B6401', // Default to working ESC d 1
    cut_command_name: 'ESC d 1 (Partial Cut)',
    print_kitchen_receipts: true,
    print_customer_receipts: false,
    auto_print_on_order: true,
    auto_print_on_payment: false,
    assigned_rooms: [],
    assigned_product_types: []
  })

  // Queries
  const { data: printers, isLoading: printersLoading } = usePrinters()
  const { data: printerConfig, isLoading: configLoading } = usePrinterConfig(selectedPrinterId)
  const { data: rooms } = useRooms()
  const { data: productTypes } = useProductTypes()

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
      printer_type: printer.printer_type,
      brand: printer.brand,
      connection_string: printer.connection_string,
      paper_width: printer.paper_width,
      supports_cut: printer.supports_cut,
      cut_command_hex: printer.cut_command_hex,
      cut_command_name: printer.cut_command_name,
      print_kitchen_receipts: printer.print_kitchen_receipts,
      print_customer_receipts: printer.print_customer_receipts,
      auto_print_on_order: printer.auto_print_on_order,
      auto_print_on_payment: printer.auto_print_on_payment,
      assigned_rooms: printerConfig?.assigned_rooms || [],
      assigned_product_types: printerConfig?.assigned_product_types || []
    })
  }

  const handleCreateNew = () => {
    setSelectedPrinterId(null)
    setIsCreating(true)
    setFormData({
      name: '',
      display_name: '',
      printer_type: 'CloudPRNT',
      brand: 'Star',
      connection_string: 'auto-detect',
      paper_width: 48,
      supports_cut: true,
      cut_command_hex: '1B6401',
      cut_command_name: 'ESC d 1 (Partial Cut)',
      print_kitchen_receipts: true,
      print_customer_receipts: false,
      auto_print_on_order: true,
      auto_print_on_payment: false,
      assigned_rooms: [],
      assigned_product_types: []
    })
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createPrinter.mutateAsync(formData)
      } else if (selectedPrinterId) {
        await updatePrinter.mutateAsync({ printerId: selectedPrinterId, formData })
      }
      alert('Printer saved successfully! ✅')
    } catch (error) {
      alert(`Failed to save printer: ${error}`)
    }
  }

  const handleTest = async (printerId: string) => {
    try {
      const result = await testPrinter.mutateAsync(printerId)
      alert(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
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
          <p className="text-muted-foreground">Configure your printers and printing rules</p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value as any }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Star">Star</option>
                      <option value="Epson">Epson</option>
                      <option value="Generic">Generic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={formData.printer_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, printer_type: e.target.value as any }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="CloudPRNT">CloudPRNT</option>
                      <option value="WebPRNT">WebPRNT</option>
                      <option value="USB">USB</option>
                      <option value="Bluetooth">Bluetooth</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Connection</label>
                  <input
                    type="text"
                    value={formData.connection_string}
                    onChange={(e) => setFormData(prev => ({ ...prev, connection_string: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    placeholder="IP address (e.g., 192.168.8.197) or auto-detect"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave as 'auto-detect' for automatic discovery in production
                  </p>
                </div>

                {/* Simplified Cut Command - hidden for now, uses working default */}
                <input type="hidden" value={formData.cut_command_hex} />
                <input type="hidden" value={formData.cut_command_name} />

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

                {/* Room Assignments */}
                {rooms && rooms.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Room Assignments</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                      {rooms.map((room) => (
                        <label key={room.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.assigned_rooms.includes(room.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  assigned_rooms: [...prev.assigned_rooms, room.id]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  assigned_rooms: prev.assigned_rooms.filter(id => id !== room.id)
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{room.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Type Assignments */}
                {productTypes && productTypes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">🎯 Product Types</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select which product types this printer should handle. This is much more flexible than categories!
                    </p>
                    <div className="grid grid-cols-1 gap-3 border rounded p-3">
                      {productTypes.map((productType) => (
                        <label key={productType.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assigned_product_types.includes(productType.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  assigned_product_types: [...prev.assigned_product_types, productType.id]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  assigned_product_types: prev.assigned_product_types.filter(id => id !== productType.id)
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: productType.color }}
                          />
                          <div className="flex-1">
                            <span className="font-medium text-sm">{productType.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({productType.code})</span>
                            {productType.description && (
                              <p className="text-xs text-muted-foreground mt-1">{productType.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Examples: Kitchen printer → "Food", Bar printer → "Drinks" + "Desserts"
                    </p>
                  </div>
                )}

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
          <CardTitle>ℹ️ Printer Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">✅ Working Configuration (TSP100)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Brand: Star</li>
                <li>• Type: CloudPRNT</li>
                <li>• Cut Command: ESC d 1 (1B6401)</li>
                <li>• Paper Width: 48 characters</li>
                <li>• Connection: IP address (e.g., 192.168.8.197)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔧 Setup Instructions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>1. Configure printer IP in network settings</li>
                <li>2. Enable CloudPRNT on printer web interface</li>
                <li>3. Set server URL to your POS system</li>
                <li>4. Test connection with the Test button</li>
                <li>5. Assign rooms and categories as needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
