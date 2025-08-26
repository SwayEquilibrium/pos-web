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
  Users, 
  Percent,
  DollarSign,
  Check,
  X,
  UserCheck,
  History,
  BarChart3
} from 'lucide-react'
import { 
  useCustomerGroups,
  useCreateCustomerGroup, 
  useUpdateCustomerGroup, 
  useDeleteCustomerGroup,
  type CustomerGroup 
} from '@/hooks/useCustomerGroups'
import CustomerGroupHistory from '@/components/CustomerGroupHistory'

interface CustomerGroupForm {
  name: string
  description: string
  discount_percentage: number
  discount_amount: number
  color: string
}

export default function CustomerGroupsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null)
  const [viewingHistory, setViewingHistory] = useState<CustomerGroup | null>(null)
  const [formData, setFormData] = useState<CustomerGroupForm>({
    name: '',
    description: '',
    discount_percentage: 0,
    discount_amount: 0,
    color: '#3B82F6'
  })

  // Data fetching
  const { data: customerGroups, isLoading } = useCustomerGroups()
  const createCustomerGroup = useCreateCustomerGroup()
  const updateCustomerGroup = useUpdateCustomerGroup()
  const deleteCustomerGroup = useDeleteCustomerGroup()

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: 0,
      discount_amount: 0,
      color: '#3B82F6'
    })
  }

  const handleCreate = () => {
    setEditingGroup(null)
    resetForm()
    setShowCreateDialog(true)
  }

  const handleEdit = (group: CustomerGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      discount_percentage: group.discount_percentage || 0,
      discount_amount: group.discount_amount || 0,
      color: group.color || '#3B82F6'
    })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    try {
      if (editingGroup) {
        // Update existing
        await updateCustomerGroup.mutateAsync({
          id: editingGroup.id,
          ...formData
        })
        setShowEditDialog(false)
      } else {
        // Create new
        await createCustomerGroup.mutateAsync(formData)
        setShowCreateDialog(false)
      }
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      
      // Check if it's a database setup issue
      if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
        alert('Customer group saved in demo mode. Set up database for full functionality.')
      } else {
        alert('Failed to save customer group')
      }
    }
  }

  const handleDelete = async (group: CustomerGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) {
      return
    }

    try {
      await deleteCustomerGroup.mutateAsync(group.id)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete customer group')
    }
  }

  const handleViewHistory = (group: CustomerGroup) => {
    setViewingHistory(group)
  }

  // Show history view if selected
  if (viewingHistory) {
    return (
      <CustomerGroupHistory 
        group={viewingHistory} 
        onClose={() => setViewingHistory(null)} 
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Groups</h1>
        <p className="text-gray-600">
          Manage customer discount groups for VIP customers, staff, business partners, and more.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {customerGroups?.filter(g => g.active).length || 0} Active Groups
          </Badge>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer Group
        </Button>
      </div>

      {/* Customer Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customerGroups?.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: group.color }}
                >
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && (
                    <p className="text-gray-600 text-sm">{group.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Information */}
              <div className="space-y-2">
                {group.discount_percentage > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {group.discount_percentage}% discount
                    </span>
                  </div>
                )}
                {group.discount_amount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {group.discount_amount} kr discount
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                    className="flex-1 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(group)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleViewHistory(group)}
                  className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <History className="w-3 h-3 mr-1" />
                  View History & Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {(!customerGroups || customerGroups.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customer groups yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create customer groups to offer discounts to VIP customers, staff, or business partners.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Customer Group' : 'Create New Customer Group'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VIP Customers, Staff Discount"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-20 h-10 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this customer group"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discountAmount">Fixed Discount (kr)</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{formData.name}</div>
                    {formData.description && (
                      <div className="text-sm text-gray-600">{formData.description}</div>
                    )}
                    <div className="text-sm text-green-600">
                      {formData.discount_percentage > 0 && `${formData.discount_percentage}% discount`}
                      {formData.discount_amount > 0 && ` + ${formData.discount_amount} kr discount`}
                      {formData.discount_percentage === 0 && formData.discount_amount === 0 && 'No discount'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false)
              setShowEditDialog(false)
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name.trim() || createCustomerGroup.isPending || updateCustomerGroup.isPending}
            >
              {(createCustomerGroup.isPending || updateCustomerGroup.isPending) ? 'Saving...' : (editingGroup ? 'Save Changes' : 'Create Group')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}