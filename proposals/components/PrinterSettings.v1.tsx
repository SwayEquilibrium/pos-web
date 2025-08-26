'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  PrinterConfig, 
  getAllPrinterConfigs, 
  registerPrinterConfig, 
  updatePrinterConfig, 
  removePrinterConfig,
  getPrinterProvider
} from '@/proposals/ext/modkit/printers/registry.v1'

interface PrinterSettingsProps {
  /** Available rooms for assignment */
  rooms?: Array<{ id: string; name: string }>
  /** Available product categories */
  categories?: Array<{ id: string; name: string }>
  /** Available product types */
  productTypes?: Array<{ id: string; name: string }>
}

export default function PrinterSettings({ 
  rooms = [], 
  categories = [], 
  productTypes = [] 
}: PrinterSettingsProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Load printers on mount
  useEffect(() => {
    setPrinters(getAllPrinterConfigs())
  }, [])

  const handleSavePrinter = (printer: PrinterConfig) => {
    if (printer.id && printers.find(p => p.id === printer.id)) {
      // Update existing
      updatePrinterConfig(printer.id, printer)
    } else {
      // Add new
      const newPrinter = { ...printer, id: printer.id || `printer-${Date.now()}` }
      registerPrinterConfig(newPrinter)
    }
    
    setPrinters(getAllPrinterConfigs())
    setEditingPrinter(null)
    setShowAddForm(false)
  }

  const handleDeletePrinter = (id: string) => {
    if (confirm('Are you sure you want to delete this printer?')) {
      removePrinterConfig(id)
      setPrinters(getAllPrinterConfigs())
    }
  }

  const handleTestPrinter = async (printer: PrinterConfig) => {
    try {
      const provider = getPrinterProvider(printer.type)
      if (!provider) {
        alert(`No provider available for printer type: ${printer.type}`)
        return
      }

      await provider.testConnection?.({
        url: printer.connectionString,
        ...printer.settings
      })
      
      alert('Printer test successful!')
    } catch (error) {
      alert(`Printer test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🖨️ Printer Settings</h2>
          <p className="text-muted-foreground">
            Configure printers for different rooms, categories, and product types
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Printer
        </Button>
      </div>

      {/* Existing Printers */}
      <div className="grid gap-4">
        {printers.map(printer => (
          <Card key={printer.id}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {printer.name}
                    {!printer.enabled && <Badge variant="secondary">Disabled</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {printer.type.toUpperCase()} • {printer.connectionString}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTestPrinter(printer)}
                  >
                    Test
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingPrinter(printer)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeletePrinter(printer.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium">Assigned Rooms</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {printer.assignedRooms.length > 0 ? (
                      printer.assignedRooms.map(roomId => {
                        const room = rooms.find(r => r.id === roomId)
                        return (
                          <Badge key={roomId} variant="outline" className="text-xs">
                            {room?.name || roomId}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Categories</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {printer.assignedCategories.length > 0 ? (
                      printer.assignedCategories.map(catId => {
                        const category = categories.find(c => c.id === catId)
                        return (
                          <Badge key={catId} variant="outline" className="text-xs">
                            {category?.name || catId}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">All</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Product Types</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {printer.assignedProductTypes.length > 0 ? (
                      printer.assignedProductTypes.map(typeId => {
                        const type = productTypes.find(t => t.id === typeId)
                        return (
                          <Badge key={typeId} variant="outline" className="text-xs">
                            {type?.name || typeId}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">All</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Printers Message */}
      {printers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No printers configured yet.</p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Printer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Printer Form */}
      {(showAddForm || editingPrinter) && (
        <PrinterForm
          printer={editingPrinter}
          rooms={rooms}
          categories={categories}
          productTypes={productTypes}
          onSave={handleSavePrinter}
          onCancel={() => {
            setShowAddForm(false)
            setEditingPrinter(null)
          }}
        />
      )}
    </div>
  )
}

interface PrinterFormProps {
  printer?: PrinterConfig | null
  rooms: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  productTypes: Array<{ id: string; name: string }>
  onSave: (printer: PrinterConfig) => void
  onCancel: () => void
}

function PrinterForm({ printer, rooms, categories, productTypes, onSave, onCancel }: PrinterFormProps) {
  const [formData, setFormData] = useState<PrinterConfig>(
    printer || {
      id: '',
      name: '',
      type: 'webprnt',
      connectionString: '',
      assignedRooms: [],
      assignedCategories: [],
      assignedProductTypes: [],
      enabled: true,
      settings: {}
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.connectionString) {
      alert('Please fill in all required fields')
      return
    }

    onSave(formData)
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{printer ? 'Edit Printer' : 'Add New Printer'}</CardTitle>
        <CardDescription>
          Configure printer connection and assignment settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Printer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Kitchen Printer"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Connection Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  type: e.target.value as PrinterConfig['type'],
                  connectionString: e.target.value === 'webprnt' 
                    ? 'http://192.168.1.100/StarWebPRNT/SendMessage' 
                    : ''
                })}
                className="w-full p-2 border rounded-md"
              >
                <option value="webprnt">WebPRNT (Ethernet)</option>
                <option value="usb">USB</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="connection">Connection String *</Label>
            <Input
              id="connection"
              value={formData.connectionString}
              onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
              placeholder={
                formData.type === 'webprnt' 
                  ? 'http://192.168.1.100/StarWebPRNT/SendMessage'
                  : formData.type === 'usb'
                  ? '/dev/usb/lp0'
                  : 'AA:BB:CC:DD:EE:FF'
              }
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.type === 'webprnt' && 'HTTP URL to printer\'s WebPRNT endpoint'}
              {formData.type === 'usb' && 'USB device path'}
              {formData.type === 'bluetooth' && 'Bluetooth MAC address'}
            </p>
          </div>

          {/* Room Assignment */}
          <div>
            <Label>Assigned Rooms</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {rooms.map(room => (
                <label key={room.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedRooms.includes(room.id)}
                    onChange={() => setFormData({
                      ...formData,
                      assignedRooms: toggleArrayItem(formData.assignedRooms, room.id)
                    })}
                  />
                  <span className="text-sm">{room.name}</span>
                </label>
              ))}
            </div>
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">No rooms configured</p>
            )}
          </div>

          {/* Category Assignment */}
          <div>
            <Label>Product Categories</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedCategories.includes(category.id)}
                    onChange={() => setFormData({
                      ...formData,
                      assignedCategories: toggleArrayItem(formData.assignedCategories, category.id)
                    })}
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Leave empty to print all categories
            </p>
          </div>

          {/* Product Type Assignment */}
          <div>
            <Label>Product Types</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {productTypes.map(type => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedProductTypes.includes(type.id)}
                    onChange={() => setFormData({
                      ...formData,
                      assignedProductTypes: toggleArrayItem(formData.assignedProductTypes, type.id)
                    })}
                  />
                  <span className="text-sm">{type.name}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Leave empty to print all product types
            </p>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Enable this printer</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit">Save Printer</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
