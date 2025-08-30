'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift,
  Building,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Percent
} from 'lucide-react'
import { 
  useAllPaymentTypes, 
  useCreatePaymentType, 
  useUpdatePaymentType, 
  useDeletePaymentType,
  useReorderPaymentTypes,
  type PaymentType 
} from '@/hooks/usePaymentSystem'

interface PaymentMethodForm {
  code: string
  name: string
  description: string
  requires_reference: boolean
  supports_partial: boolean
  fee_percentage: number
  fee_fixed: number
}

export default function SystemPaymentPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentType | null>(null)
  const [formData, setFormData] = useState<PaymentMethodForm>({
    code: '',
    name: '',
    description: '',
    requires_reference: false,
    supports_partial: true,
    fee_percentage: 0,
    fee_fixed: 0
  })

  // Data fetching
  const { data: paymentTypes, isLoading } = useAllPaymentTypes()
  const createPaymentType = useCreatePaymentType()
  const updatePaymentType = useUpdatePaymentType()
  const deletePaymentType = useDeletePaymentType()
  const reorderPaymentTypes = useReorderPaymentTypes()

  const getPaymentMethodIcon = (code: string) => {
    switch (code) {
      case 'CASH': return <Banknote className="w-5 h-5 text-green-600" />
      case 'CARD': return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'DANKORT': return <CreditCard className="w-5 h-5 text-red-600" />
      case 'MOBILE_PAY': return <Smartphone className="w-5 h-5 text-purple-600" />
      case 'GIFT_CARD': return <Gift className="w-5 h-5 text-pink-600" />
      case 'BANK_TRANSFER': return <Building className="w-5 h-5 text-gray-600" />
      default: return <CreditCard className="w-5 h-5 text-gray-600" />
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      requires_reference: false,
      supports_partial: true,
      fee_percentage: 0,
      fee_fixed: 0
    })
  }

  const handleCreate = () => {
    setEditingMethod(null)
    resetForm()
    setShowCreateDialog(true)
  }

  const handleEdit = (method: PaymentType) => {
    setEditingMethod(method)
    setFormData({
      code: method.code,
      name: method.name,
      description: method.description || '',
      requires_reference: method.requires_reference,
      supports_partial: method.supports_partial,
      fee_percentage: method.fee_percentage,
      fee_fixed: method.fee_fixed
    })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    try {
      if (editingMethod) {
        // Update existing
        await updatePaymentType.mutateAsync({
          id: editingMethod.id,
          ...formData
        })
        setShowEditDialog(false)
      } else {
        // Create new
        await createPaymentType.mutateAsync(formData)
        setShowCreateDialog(false)
      }
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save payment method')
    }
  }

  const handleDelete = async (method: PaymentType) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This will hide it from the payment options but preserve historical data.`)) {
      return
    }

    try {
      await deletePaymentType.mutateAsync(method.id)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete payment method')
    }
  }

  const handleToggleActive = async (method: PaymentType) => {
    try {
      await updatePaymentType.mutateAsync({
        id: method.id,
        active: !method.active
      })
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Failed to toggle payment method status')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
        <p className="text-gray-600">
          Manage payment methods available in your POS system. Changes will be reflected in payment processing and reports.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {paymentTypes?.filter(p => p.active).length || 0} Active Methods
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {paymentTypes?.filter(p => !p.active).length || 0} Inactive Methods
          </Badge>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentTypes?.map((method) => (
          <Card key={method.id} className={`transition-all ${!method.active ? 'opacity-60 bg-gray-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="cursor-move p-2 hover:bg-gray-100 rounded">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(method.code)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{method.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {method.code}
                        </Badge>
                        {!method.active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {method.description && (
                        <p className="text-gray-600 text-sm mt-1">{method.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Method Properties */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {method.requires_reference && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Requires Reference
                      </div>
                    )}
                    {method.fee_percentage > 0 && (
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {method.fee_percentage}%
                      </div>
                    )}
                    {method.fee_fixed > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {method.fee_fixed} kr
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(method)}
                      className="flex items-center gap-1"
                    >
                      {method.active ? (
                        <>
                          <X className="w-3 h-3" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(method)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Payment Method</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PAYPAL, SWISH"
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">Unique identifier (uppercase, no spaces)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., PayPal, Swish"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the payment method"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                <Input
                  id="feePercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feeFixed">Fixed Fee (kr)</Label>
                <Input
                  id="feeFixed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fee_fixed}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee_fixed: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresReference"
                  checked={formData.requires_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, requires_reference: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="requiresReference">Requires reference number</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="supportsPartial"
                  checked={formData.supports_partial}
                  onChange={(e) => setFormData(prev => ({ ...prev, supports_partial: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="supportsPartial">Supports partial payments</Label>
              </div>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <div className="flex items-center gap-3">
                  {getPaymentMethodIcon(formData.code)}
                  <div>
                    <div className="font-medium">{formData.name}</div>
                    {formData.description && (
                      <div className="text-sm text-gray-600">{formData.description}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {formData.code}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.code || !formData.name || createPaymentType.isPending}
            >
              {createPaymentType.isPending ? 'Creating...' : 'Create Payment Method'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCode">Code *</Label>
                <Input
                  id="editCode"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="uppercase"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editName">Display Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFeePercentage">Fee Percentage (%)</Label>
                <Input
                  id="editFeePercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editFeeFixed">Fixed Fee (kr)</Label>
                <Input
                  id="editFeeFixed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fee_fixed}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee_fixed: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editRequiresReference"
                  checked={formData.requires_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, requires_reference: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="editRequiresReference">Requires reference number</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editSupportsPartial"
                  checked={formData.supports_partial}
                  onChange={(e) => setFormData(prev => ({ ...prev, supports_partial: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="editSupportsPartial">Supports partial payments</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.code || !formData.name || updatePaymentType.isPending}
            >
              {updatePaymentType.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
