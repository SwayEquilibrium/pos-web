'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Printer, Settings, Plus, Power, TestTube, AlertCircle, Loader2 } from 'lucide-react'
import { usePrinters, useDeletePrinter, useUpdatePrinter, useCreatePrinter, useTestPrinterConnection } from '@/hooks/usePrinters'
import { toast } from 'sonner'

export default function PrintersPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<any>(null)
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    display_name: '',
    connection_string: '',
    brand: 'Star',
    paper_width: 48,
    print_kitchen_receipts: true,
    print_customer_receipts: false,
    auto_print_on_order: true,
    is_active: true
  })

  // Fetch printers
  const { data: printers = [], isLoading, error, refetch } = usePrinters()
  const createPrinter = useCreatePrinter()
  const updatePrinter = useUpdatePrinter()
  const deletePrinter = useDeletePrinter()
  const testConnection = useTestPrinterConnection()

  const handleAddPrinter = async () => {
    if (!newPrinter.name || !newPrinter.connection_string) {
      toast.error('Please fill in name and IP address')
      return
    }

    try {
      await createPrinter.mutateAsync({
        ...newPrinter,
        printer_type: 'thermal'
      })
      toast.success('Printer added successfully!')
      setShowAddDialog(false)
      setNewPrinter({
        name: '',
        display_name: '',
        connection_string: '',
        brand: 'Star',
        paper_width: 48,
        print_kitchen_receipts: true,
        print_customer_receipts: false,
        auto_print_on_order: true,
        is_active: true
      })
    } catch (error) {
      toast.error('Failed to add printer')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPrinter) return

    try {
      await updatePrinter.mutateAsync({
        id: editingPrinter.id,
        ...editingPrinter
      })
      toast.success('Printer updated!')
      setEditingPrinter(null)
    } catch (error) {
      toast.error('Failed to update printer')
    }
  }

  const handleDelete = async (printer: any) => {
    if (!confirm(`Delete "${printer.display_name}"?`)) return

    try {
      await deletePrinter.mutateAsync(printer.id)
      toast.success('Printer deleted')
    } catch (error) {
      toast.error('Failed to delete printer')
    }
  }

  const handleToggle = async (printer: any) => {
    try {
      await updatePrinter.mutateAsync({
        id: printer.id,
        is_active: !printer.is_active
      })
      toast.success(`Printer ${printer.is_active ? 'disabled' : 'enabled'}`)
    } catch (error) {
      toast.error('Failed to update printer')
    }
  }

  const handleTest = async (printerId: string) => {
    try {
      const result = await testConnection.mutateAsync(printerId)
      toast.success(result.message)
    } catch (error) {
      toast.error('Test failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Printers</h1>
            <p className="text-gray-600">Manage your kitchen receipt printers</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Printer
          </Button>
        </div>

        {/* Loading/Error States */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading printers...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load printers</p>
              <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
            </CardContent>
          </Card>
        ) : printers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Printer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Printers Yet</h3>
              <p className="text-gray-600 mb-6">Add your first printer to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Printer
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Printers List */
          <div className="space-y-4">
            {printers.map((printer) => (
              <Card key={printer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${printer.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <CardTitle className="text-lg">{printer.display_name}</CardTitle>
                        <CardDescription>
                          {printer.brand} • {printer.connection_string}
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
                        onClick={() => setEditingPrinter(printer)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>🍳 Kitchen: {printer.print_kitchen_receipts ? 'Yes' : 'No'}</span>
                      <span>👤 Customer: {printer.print_customer_receipts ? 'Yes' : 'No'}</span>
                      <span>🔄 Auto-print: {printer.auto_print_on_order ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(printer.id)}
                        disabled={testConnection.isPending}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(printer)}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {printer.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(printer)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
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
              <DialogDescription>Add your kitchen receipt printer</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Printer Name</Label>
                <Input
                  id="name"
                  placeholder="kitchen-01"
                  value={newPrinter.name}
                  onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Kitchen Printer"
                  value={newPrinter.display_name}
                  onChange={(e) => setNewPrinter({ ...newPrinter, display_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="connection_string">IP Address</Label>
                <Input
                  id="connection_string"
                  placeholder="192.168.8.192"
                  value={newPrinter.connection_string}
                  onChange={(e) => setNewPrinter({ ...newPrinter, connection_string: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Star, Epson, etc."
                  value={newPrinter.brand}
                  onChange={(e) => setNewPrinter({ ...newPrinter, brand: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Print Kitchen Receipts</Label>
                  <Switch
                    checked={newPrinter.print_kitchen_receipts}
                    onCheckedChange={(checked) => setNewPrinter({ ...newPrinter, print_kitchen_receipts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Print Customer Receipts</Label>
                  <Switch
                    checked={newPrinter.print_customer_receipts}
                    onCheckedChange={(checked) => setNewPrinter({ ...newPrinter, print_customer_receipts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto-print on Order</Label>
                  <Switch
                    checked={newPrinter.auto_print_on_order}
                    onCheckedChange={(checked) => setNewPrinter({ ...newPrinter, auto_print_on_order: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrinter} disabled={createPrinter.isPending}>
                {createPrinter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Printer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Printer Dialog */}
        {editingPrinter && (
          <Dialog open={!!editingPrinter} onOpenChange={() => setEditingPrinter(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Printer</DialogTitle>
                <DialogDescription>Update printer settings</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Printer Name</Label>
                  <Input
                    id="edit-name"
                    value={editingPrinter.name}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-display_name">Display Name</Label>
                  <Input
                    id="edit-display_name"
                    value={editingPrinter.display_name}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, display_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-connection_string">IP Address</Label>
                  <Input
                    id="edit-connection_string"
                    value={editingPrinter.connection_string}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, connection_string: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-brand">Brand</Label>
                  <Input
                    id="edit-brand"
                    value={editingPrinter.brand || ''}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Print Kitchen Receipts</Label>
                    <Switch
                      checked={editingPrinter.print_kitchen_receipts}
                      onCheckedChange={(checked) => setEditingPrinter({ ...editingPrinter, print_kitchen_receipts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Print Customer Receipts</Label>
                    <Switch
                      checked={editingPrinter.print_customer_receipts}
                      onCheckedChange={(checked) => setEditingPrinter({ ...editingPrinter, print_customer_receipts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-print on Order</Label>
                    <Switch
                      checked={editingPrinter.auto_print_on_order}
                      onCheckedChange={(checked) => setEditingPrinter({ ...editingPrinter, auto_print_on_order: checked })}
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
