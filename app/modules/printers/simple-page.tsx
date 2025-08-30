'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Printer,
  Settings,
  Plus,
  Power,
  Loader2,
  Users,
  TestTube,
  Wifi,
  Keyboard,
  AlertCircle
} from 'lucide-react'
import {
  usePrinters,
  useDeletePrinter,
  useUpdatePrinter,
  useCreatePrinter,
  usePrinterGroups,
  useAssignPrinterToGroup,
  useTestPrinterConnection
} from '@/hooks/usePrinters'
import { toast } from 'sonner'
import PrinterDiscovery from '@/components/PrinterDiscovery'

export default function PrintersPage() {
  const [editingPrinter, setEditingPrinter] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addMode, setAddMode] = useState<'discover' | 'manual'>('discover')
  const [printerType, setPrinterType] = useState<'thermal' | 'laser' | 'inkjet' | 'label'>('thermal')
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '',
    brand: '',
    printer_type: 'thermal' as 'thermal' | 'laser' | 'inkjet' | 'label',
    paper_width: 48,
    print_kitchen_receipts: true,
    print_customer_receipts: true,
    auto_print_on_order: false,
    auto_print_on_payment: false
  })

  // Fetch data
  const { data: printers = [], isLoading: printersLoading, error: printersError, refetch } = usePrinters()
  const { data: printerGroups = [] } = usePrinterGroups()

  // Hooks
  const deletePrinter = useDeletePrinter()
  const updatePrinter = useUpdatePrinter()
  const assignPrinterToGroup = useAssignPrinterToGroup()
  const testConnection = useTestPrinterConnection()

  // Handle editing printer
  useEffect(() => {
    if (editingPrinter && printers.length > 0) {
      const printer = printers.find(p => p.id === editingPrinter)
      if (printer) {
        setEditForm({
          display_name: printer.display_name,
          brand: printer.brand || '',
          printer_type: printer.printer_type,
          paper_width: printer.paper_width,
          print_kitchen_receipts: printer.print_kitchen_receipts,
          print_customer_receipts: printer.print_customer_receipts,
          auto_print_on_order: printer.auto_print_on_order,
          auto_print_on_payment: printer.auto_print_on_payment
        })
      }
    }
  }, [editingPrinter, printers])

  const handleDeletePrinter = async (printerId: string, printerName: string) => {
    if (!confirm(`Are you sure you want to delete "${printerName}"?`)) return

    try {
      await deletePrinter.mutateAsync(printerId)
      toast.success(`Printer "${printerName}" deleted successfully`)
    } catch (error) {
      toast.error('Failed to delete printer')
    }
  }

  const handleTogglePrinter = async (printer: any) => {
    try {
      await updatePrinter.mutateAsync({
        id: printer.id,
        is_active: !printer.is_active
      })
      toast.success(`Printer "${printer.display_name}" ${printer.is_active ? 'disabled' : 'enabled'}`)
    } catch (error) {
      toast.error('Failed to update printer status')
    }
  }

  const handleTestPrinter = async (printerId: string) => {
    try {
      const result = await testConnection.mutateAsync(printerId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Connection test failed')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPrinter) return

    try {
      await updatePrinter.mutateAsync({
        id: editingPrinter,
        display_name: editForm.display_name,
        brand: editForm.brand,
        printer_type: editForm.printer_type,
        paper_width: editForm.paper_width,
        print_kitchen_receipts: editForm.print_kitchen_receipts,
        print_customer_receipts: editForm.print_customer_receipts,
        auto_print_on_order: editForm.auto_print_on_order,
        auto_print_on_payment: editForm.auto_print_on_payment
      })
      toast.success('Printer configuration updated successfully')
      setEditingPrinter(null)
    } catch (error) {
      toast.error('Failed to update printer configuration')
    }
  }

  const handleAddPrinter = () => {
    setShowDiscovery(true)
    setShowAddDialog(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Printers</h1>
            <p className="text-gray-600 mt-1">Manage your printing devices</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Printer
          </Button>
        </div>

        {/* Printers List */}
        {printersLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading printers...</span>
              </div>
            </CardContent>
          </Card>
        ) : printersError ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center text-center">
                <div>
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Printers</h3>
                  <p className="text-gray-600 mb-4">There was a problem loading your printers.</p>
                  <Button onClick={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : printers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Printer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Printers Configured</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first printer to the system.</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Printer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {printers.map((printer) => (
              <Card key={printer.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${printer.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <CardTitle className="text-lg">{printer.display_name}</CardTitle>
                        <CardDescription>
                          {printer.brand} • {printer.printer_type} • {printer.connection_string}:{printer.paper_width}mm
                          {printer.printer_group_id && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3" />
                              <span className="text-xs">
                                Group: {printerGroups.find(g => g.id === printer.printer_group_id)?.display_name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={printer.is_active ? 'default' : 'secondary'}>
                        {printer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPrinter(printer.id)
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>Kitchen: {printer.print_kitchen_receipts ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Customer: {printer.print_customer_receipts ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Auto Order: {printer.auto_print_on_order ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Auto Payment: {printer.auto_print_on_payment ? '✓' : '✗'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTestPrinter(printer.id)
                        }}
                        disabled={testConnection.isPending}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePrinter(printer)
                        }}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {printer.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Printer Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Printer</DialogTitle>
              <DialogDescription>
                Choose how you want to add your printer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="printer-type">Printer Type</Label>
                <Select value={printerType} onValueChange={(value) => setPrinterType(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select printer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal Printer</SelectItem>
                    <SelectItem value="laser">Laser Printer</SelectItem>
                    <SelectItem value="inkjet">Inkjet Printer</SelectItem>
                    <SelectItem value="label">Label Printer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>How would you like to set it up?</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Card
                    className={`cursor-pointer border-2 ${addMode === 'discover' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-300 transition-colors`}
                    onClick={() => setAddMode('discover')}
                  >
                    <CardContent className="p-4 text-center">
                      <Wifi className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-semibold mb-1">Network Discovery</h3>
                      <p className="text-sm text-gray-600">Automatically find printers on your network</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 ${addMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-300 transition-colors`}
                    onClick={() => setAddMode('manual')}
                  >
                    <CardContent className="p-4 text-center">
                      <Keyboard className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-semibold mb-1">Manual Setup</h3>
                      <p className="text-sm text-gray-600">Enter printer details manually</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrinter}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discovery Component */}
        {showDiscovery && (
          <Card>
            <CardHeader>
              <CardTitle>Network Printer Discovery</CardTitle>
              <CardDescription>Find and configure printers on your network</CardDescription>
            </CardHeader>
            <CardContent>
              <PrinterDiscovery
                onRefreshNeeded={() => {
                  refetch()
                  setShowDiscovery(false)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Printer Dialog */}
        {editingPrinter && (
          <Dialog open={!!editingPrinter} onOpenChange={() => setEditingPrinter(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure Printer</DialogTitle>
                <DialogDescription>
                  Update printer settings and configuration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-display-name" className="text-right">
                    Display Name
                  </Label>
                  <Input
                    id="edit-display-name"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-brand" className="text-right">
                    Brand
                  </Label>
                  <Input
                    id="edit-brand"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={editForm.printer_type}
                    onValueChange={(value) => setEditForm({ ...editForm, printer_type: value as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select printer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal">Thermal</SelectItem>
                      <SelectItem value="laser">Laser</SelectItem>
                      <SelectItem value="inkjet">Inkjet</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-paper-width" className="text-right">
                    Paper Width (mm)
                  </Label>
                  <Input
                    id="edit-paper-width"
                    type="number"
                    value={editForm.paper_width}
                    onChange={(e) => setEditForm({ ...editForm, paper_width: parseInt(e.target.value) || 48 })}
                    className="col-span-3"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-kitchen-receipts">Print Kitchen Receipts</Label>
                    <Switch
                      id="edit-kitchen-receipts"
                      checked={editForm.print_kitchen_receipts}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, print_kitchen_receipts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-customer-receipts">Print Customer Receipts</Label>
                    <Switch
                      id="edit-customer-receipts"
                      checked={editForm.print_customer_receipts}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, print_customer_receipts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-auto-order">Auto Print on Order</Label>
                    <Switch
                      id="edit-auto-order"
                      checked={editForm.auto_print_on_order}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, auto_print_on_order: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-auto-payment">Auto Print on Payment</Label>
                    <Switch
                      id="edit-auto-payment"
                      checked={editForm.auto_print_on_payment}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, auto_print_on_payment: checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPrinter(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updatePrinter.isPending}>
                  {updatePrinter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

