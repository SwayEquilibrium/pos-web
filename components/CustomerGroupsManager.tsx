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

interface CustomerGroupsManagerProps {
  showHeader?: boolean
  className?: string
}

export default function CustomerGroupsManager({ showHeader = true, className = '' }: CustomerGroupsManagerProps) {
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
    if (!formData.name.trim()) return

    try {
      if (editingGroup) {
        await updateCustomerGroup.mutateAsync({
          id: editingGroup.id,
          updates: formData
        })
        setShowEditDialog(false)
      } else {
        await createCustomerGroup.mutateAsync(formData)
        setShowCreateDialog(false)
      }
      resetForm()
      setEditingGroup(null)
    } catch (error) {
      console.error('Failed to save customer group:', error)
    }
  }

  const handleDelete = async (group: CustomerGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return

    try {
      await deleteCustomerGroup.mutateAsync(group.id)
    } catch (error) {
      console.error('Failed to delete customer group:', error)
    }
  }

  const handleViewHistory = (group: CustomerGroup) => {
    setViewingHistory(group)
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {showHeader && <div className="h-8 bg-gray-200 rounded w-1/3"></div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (viewingHistory) {
    return (
      <div className={className}>
        <CustomerGroupHistory 
          group={viewingHistory} 
          onClose={() => setViewingHistory(null)} 
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Groups</h1>
          <p className="text-muted-foreground">
            Manage customer discount groups for VIP customers, staff, business partners, and more.
          </p>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center">
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
          <Card key={group.id} className="hover:shadow-lg transition-all duration-200 hover:transform hover:scale-[1.02]">
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

        {(!customerGroups || customerGroups.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customer groups yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first customer group to start offering discounts to specific customer segments.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Customer Group
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VIP Customers, Staff, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this customer group"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Discount %</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_percentage: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Fixed Discount (kr)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_amount: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-10"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                <Check className="w-4 h-4 mr-2" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VIP Customers, Staff, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this customer group"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discount_percentage">Discount %</Label>
                <Input
                  id="edit-discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_percentage: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-discount_amount">Fixed Discount (kr)</Label>
                <Input
                  id="edit-discount_amount"
                  type="number"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    discount_amount: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-10"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
