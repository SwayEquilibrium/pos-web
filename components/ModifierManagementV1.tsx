'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit3, 
  Trash2,
  ArrowLeft,
  Tags,
  DollarSign,
  CheckSquare,
  Square,
  Save,
  X
} from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'
import { ContextualSaveButton, useFormChanges } from './ContextualSaveButton'
import { 
  useModifierGroups, 
  useModifiersByGroup, 
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useCreateModifier,
  useUpdateModifier,
  useDeleteModifierGroup,
  useDeleteModifier,
  type ModifierGroup,
  type Modifier
} from '@/hooks/useMenu'
import { toast } from 'sonner'
import AddModifierItemModal from './AddModifierItemModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'

interface ModifierGroupWithItems extends ModifierGroup {
  items: Modifier[]
}

interface ModifierGroupFormData {
  name: string
  type: 'variant' | 'addon'
  is_required: boolean
  description?: string
}

interface ModifierItemFormData {
  name: string
  price_adjustment: number
  description?: string
}

export default function ModifierManagementV1() {
  const router = useRouter()
  const { t } = useTranslation()
  
  // Queries
  const { data: modifierGroups = [], isLoading: groupsLoading, error: groupsError } = useModifierGroups()
  
  // Mutations
  const createGroupMutation = useCreateModifierGroup()
  const updateGroupMutation = useUpdateModifierGroup()
  const createModifierMutation = useCreateModifier()
  const updateModifierMutation = useUpdateModifier()
  const deleteGroupMutation = useDeleteModifierGroup()
  const deleteModifierMutation = useDeleteModifier()
  
  // State for form management
  const [modifierGroupsWithItems, setModifierGroupsWithItems] = useState<ModifierGroupWithItems[]>([])
  const [originalData, setOriginalData] = useState<ModifierGroupWithItems[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ groupId: string; itemId: string } | null>(null)
  
  // Modal states
  const [showAddItemModal, setShowAddItemModal] = useState<{ groupId: string; groupName: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'group' | 'item'
    id: string
    name: string
    groupId?: string
  } | null>(null)
  
  // Form data
  const [newGroupForm, setNewGroupForm] = useState<ModifierGroupFormData>({
    name: '',
    type: 'addon',
    is_required: false,
    description: ''
  })

  // Load modifiers for each group
  useEffect(() => {
    const loadModifiersForGroups = async () => {
      if (!modifierGroups.length) {
        setModifierGroupsWithItems([])
        setOriginalData([])
        return
      }

      const groupsWithItems: ModifierGroupWithItems[] = []
      
      for (const group of modifierGroups) {
        try {
          const modifiersQuery = useModifiersByGroup(group.id)
          const modifiers = modifiersQuery.data || []
          
          groupsWithItems.push({
            ...group,
            items: modifiers || []
          })
        } catch (error) {
          console.error(`Error loading modifiers for group ${group.id}:`, error)
          groupsWithItems.push({
            ...group,
            items: []
          })
        }
      }
      
      setModifierGroupsWithItems(groupsWithItems)
      setOriginalData(JSON.parse(JSON.stringify(groupsWithItems))) // Deep copy
    }

    loadModifiersForGroups()
  }, [modifierGroups])

  // Track changes
  const { hasChanges, changedFields, resetChanges } = useFormChanges(
    originalData,
    modifierGroupsWithItems,
    ['name', 'type', 'is_required', 'description', 'items']
  )

  const handleSaveChanges = useCallback(async () => {
    try {
      // Save all changes to database
      for (const group of modifierGroupsWithItems) {
        const originalGroup = originalData.find(g => g.id === group.id)
        
        // Update group if changed
        if (originalGroup && (
          originalGroup.name !== group.name ||
          originalGroup.type !== group.type ||
          originalGroup.is_required !== group.is_required ||
          originalGroup.description !== group.description
        )) {
          await updateGroupMutation.mutateAsync({
            id: group.id,
            name: group.name,
            type: group.type,
            is_required: group.is_required,
            description: group.description
          })
        }

        // Update modifiers
        for (const item of group.items) {
          const originalItem = originalGroup?.items.find(i => i.id === item.id)
          
          if (originalItem && (
            originalItem.name !== item.name ||
            originalItem.price_adjustment !== item.price_adjustment ||
            originalItem.description !== item.description
          )) {
            await updateModifierMutation.mutateAsync({
              id: item.id,
              name: item.name,
              price_adjustment: item.price_adjustment,
              description: item.description
            })
          }
        }
      }

      // Update original data to current state
      setOriginalData(JSON.parse(JSON.stringify(modifierGroupsWithItems)))
      resetChanges()
      
      toast.success(t('language') === 'da' ? 'Ændringer gemt!' : 'Changes saved!')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error(t('language') === 'da' ? 'Fejl ved gemning' : 'Error saving changes')
      throw error
    }
  }, [modifierGroupsWithItems, originalData, updateGroupMutation, updateModifierMutation, resetChanges, t])

  const handleCancelChanges = useCallback(() => {
    setModifierGroupsWithItems(JSON.parse(JSON.stringify(originalData)))
    resetChanges()
    setEditingGroup(null)
    setEditingItem(null)
  }, [originalData, resetChanges])

  const createGroup = async () => {
    if (!newGroupForm.name.trim()) return

    try {
      const newGroup = await createGroupMutation.mutateAsync({
        name: newGroupForm.name,
        type: newGroupForm.type,
        is_required: newGroupForm.is_required,
        description: newGroupForm.description
      })

      const newGroupWithItems: ModifierGroupWithItems = {
        ...newGroup,
        items: []
      }

      setModifierGroupsWithItems(prev => [...prev, newGroupWithItems])
      setOriginalData(prev => [...prev, newGroupWithItems])
      
      setNewGroupForm({ name: '', type: 'addon', is_required: false, description: '' })
      setShowCreateGroup(false)
      
      toast.success(t('language') === 'da' ? 'Gruppe oprettet!' : 'Group created!')
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error(t('language') === 'da' ? 'Fejl ved oprettelse' : 'Error creating group')
    }
  }

  const updateGroupField = (groupId: string, field: keyof ModifierGroup, value: any) => {
    setModifierGroupsWithItems(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, [field]: value }
        : group
    ))
  }

  const updateModifierField = (groupId: string, modifierId: string, field: keyof Modifier, value: any) => {
    setModifierGroupsWithItems(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            items: group.items.map(item =>
              item.id === modifierId 
                ? { ...item, [field]: value }
                : item
            )
          }
        : group
    ))
  }

  const handleAddItemToGroup = (groupId: string, groupName: string) => {
    setShowAddItemModal({ groupId, groupName })
  }

  const handleAddItemSubmit = async (data: { name: string; price_adjustment: number; description?: string }) => {
    if (!showAddItemModal) return

    try {
      const newModifier = await createModifierMutation.mutateAsync({
        group_id: showAddItemModal.groupId,
        name: data.name,
        price_adjustment: data.price_adjustment,
        description: data.description
      })

      setModifierGroupsWithItems(prev => prev.map(group => 
        group.id === showAddItemModal.groupId 
          ? { ...group, items: [...group.items, newModifier] }
          : group
      ))
      
      setOriginalData(prev => prev.map(group => 
        group.id === showAddItemModal.groupId 
          ? { ...group, items: [...group.items, newModifier] }
          : group
      ))

      setShowAddItemModal(null)
      toast.success(t('language') === 'da' ? 'Item tilføjet!' : 'Item added!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error(t('language') === 'da' ? 'Fejl ved tilføjelse' : 'Error adding item')
    }
  }

  const handleDeleteGroup = async () => {
    if (!showDeleteConfirm || showDeleteConfirm.type !== 'group') return

    try {
      await deleteGroupMutation.mutateAsync(showDeleteConfirm.id)

      setModifierGroupsWithItems(prev => prev.filter(group => group.id !== showDeleteConfirm.id))
      setOriginalData(prev => prev.filter(group => group.id !== showDeleteConfirm.id))
      
      setShowDeleteConfirm(null)
      toast.success(t('language') === 'da' ? 'Gruppe slettet!' : 'Group deleted!')
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(t('language') === 'da' ? 'Fejl ved sletning' : 'Error deleting group')
    }
  }

  const handleDeleteModifier = async () => {
    if (!showDeleteConfirm || showDeleteConfirm.type !== 'item' || !showDeleteConfirm.groupId) return

    try {
      await deleteModifierMutation.mutateAsync(showDeleteConfirm.id)

      setModifierGroupsWithItems(prev => prev.map(group => 
        group.id === showDeleteConfirm.groupId 
          ? { ...group, items: group.items.filter(item => item.id !== showDeleteConfirm.id) }
          : group
      ))
      
      setOriginalData(prev => prev.map(group => 
        group.id === showDeleteConfirm.groupId 
          ? { ...group, items: group.items.filter(item => item.id !== showDeleteConfirm.id) }
          : group
      ))

      setShowDeleteConfirm(null)
      toast.success(t('language') === 'da' ? 'Item slettet!' : 'Item deleted!')
    } catch (error) {
      console.error('Error deleting modifier:', error)
      toast.error(t('language') === 'da' ? 'Fejl ved sletning' : 'Error deleting item')
    }
  }

  const getTypeIcon = (type: 'variant' | 'addon') => {
    return type === 'variant' ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />
  }

  const getTypeLabel = (type: 'variant' | 'addon') => {
    return type === 'variant' 
      ? (t('language') === 'da' ? 'Vælg én' : 'Choose one')
      : (t('language') === 'da' ? 'Vælg flere' : 'Choose multiple')
  }

  const getTypeColor = (type: 'variant' | 'addon') => {
    return type === 'variant' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  // Error state - database setup needed
  if (groupsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.push('/menu')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('language') === 'da' ? 'Addons & Modifiers' : 'Addons & Modifiers'}
              </h1>
              <p className="text-red-600">
                {t('language') === 'da' ? 'Database setup påkrævet' : 'Database setup required'}
              </p>
            </div>
          </div>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-red-900 mb-3">
                {t('language') === 'da' ? 'Modifier tabeller ikke fundet' : 'Modifier tables not found'}
              </h3>
              <p className="text-red-800 mb-4">
                {t('language') === 'da' 
                  ? 'Modifier systemet kræver database tabeller. Kør følgende SQL i Supabase:'
                  : 'The modifier system requires database tables. Run the following SQL in Supabase:'
                }
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto mb-4">
{`-- Run in Supabase SQL Editor
-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('variant', 'addon')),
    is_required BOOLEAN DEFAULT false,
    sort_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifiers table
CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    sort_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_modifiers junction table
CREATE TABLE IF NOT EXISTS product_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    sort_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, modifier_group_id)
);`}
              </pre>
              <div className="flex gap-3">
                <Button onClick={() => window.location.reload()}>
                  {t('language') === 'da' ? 'Genindlæs efter setup' : 'Reload after setup'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/menu')}>
                  {t('language') === 'da' ? 'Tilbage til menu' : 'Back to menu'}
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left bg-red-100 p-4 rounded">
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify({ groupsError, groupsLoading }, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state
  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.push('/menu')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('language') === 'da' ? 'Addons & Modifiers' : 'Addons & Modifiers'}
              </h1>
              <p className="text-gray-600">
                {t('language') === 'da' ? 'Indlæser data fra database...' : 'Loading data from database...'}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/menu')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('language') === 'da' ? 'Addons & Modifiers' : 'Addons & Modifiers'}
              </h1>
              <p className="text-gray-600">
                {t('language') === 'da' 
                  ? 'Administrer tilvalg og modifikationer til dine produkter' 
                  : 'Manage add-ons and modifications for your products'
                }
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            {t('language') === 'da' ? 'Ny Gruppe' : 'New Group'}
          </Button>
        </div>

        {/* Create Group Form */}
        {showCreateGroup && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {t('language') === 'da' ? 'Opret Ny Modifier Gruppe' : 'Create New Modifier Group'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('language') === 'da' ? 'Gruppe Navn' : 'Group Name'}
                  </label>
                  <Input
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('language') === 'da' ? 'F.eks. Størrelse, Sovser, Tilbehør' : 'e.g. Size, Sauces, Extras'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select 
                    value={newGroupForm.type}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, type: e.target.value as 'variant' | 'addon' }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="addon">
                      {t('language') === 'da' ? 'Addon (vælg flere)' : 'Addon (choose multiple)'}
                    </option>
                    <option value="variant">
                      {t('language') === 'da' ? 'Variant (vælg én)' : 'Variant (choose one)'}
                    </option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={newGroupForm.is_required}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, is_required: e.target.checked }))}
                    />
                    <span className="text-sm font-medium">
                      {t('language') === 'da' ? 'Påkrævet' : 'Required'}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={createGroup} className="bg-green-600 hover:bg-green-700">
                  {t('language') === 'da' ? 'Opret Gruppe' : 'Create Group'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                  {t('language') === 'da' ? 'Annuller' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modifier Groups */}
        <div className="space-y-6">
          {modifierGroupsWithItems.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tags className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        {editingGroup === group.id ? (
                          <Input
                            value={group.name}
                            onChange={(e) => updateGroupField(group.id, 'name', e.target.value)}
                            className="font-semibold"
                            onBlur={() => setEditingGroup(null)}
                            autoFocus
                          />
                        ) : (
                          <CardTitle 
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                            onClick={() => setEditingGroup(group.id)}
                          >
                            {group.name}
                            <Edit3 className="w-4 h-4 opacity-50" />
                          </CardTitle>
                        )}
                        
                        <Badge className={getTypeColor(group.type)}>
                          {getTypeIcon(group.type)}
                          <span className="ml-1">{getTypeLabel(group.type)}</span>
                        </Badge>
                        
                        {group.is_required && (
                          <Badge variant="outline" className="text-red-600">
                            {t('language') === 'da' ? 'Påkrævet' : 'Required'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {group.items.length} items • 
                        {group.type === 'variant' 
                          ? (t('language') === 'da' ? ' Kunden skal vælge én option' : ' Customer must choose one option')
                          : (t('language') === 'da' ? ' Kunden kan vælge flere options' : ' Customer can choose multiple options')
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddItemToGroup(group.id, group.name)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('language') === 'da' ? 'Tilføj Item' : 'Add Item'}
                    </Button>
                    <Button 
                      onClick={() => setShowDeleteConfirm({
                        type: 'group',
                        id: group.id,
                        name: group.name
                      })}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('language') === 'da' ? 'Slet Gruppe' : 'Delete Group'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {group.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tags className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('language') === 'da' ? 'Ingen items i denne gruppe' : 'No items in this group'}</p>
                    <Button 
                      onClick={() => handleAddItemToGroup(group.id, group.name)}
                      variant="outline"
                      className="mt-3"
                    >
                      {t('language') === 'da' ? 'Tilføj første item' : 'Add first item'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((item) => {
                      const isEditing = editingItem?.groupId === group.id && editingItem?.itemId === item.id
                      
                      return (
                        <div 
                          key={item.id}
                          className="p-3 border rounded-lg bg-white border-gray-200 hover:border-blue-200 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              {isEditing ? (
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateModifierField(group.id, item.id, 'name', e.target.value)}
                                  className="font-medium text-sm"
                                  onBlur={() => setEditingItem(null)}
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  className="font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1"
                                  onClick={() => setEditingItem({ groupId: group.id, itemId: item.id })}
                                >
                                  {item.name}
                                  <Edit3 className="w-3 h-3 opacity-50" />
                                </span>
                              )}
                            </div>
                            <Button
                              onClick={() => setShowDeleteConfirm({
                                type: 'item',
                                id: item.id,
                                name: item.name,
                                groupId: group.id
                              })}
                              size="sm"
                              variant="ghost"
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price_adjustment}
                                onChange={(e) => updateModifierField(group.id, item.id, 'price_adjustment', parseFloat(e.target.value) || 0)}
                                className="text-sm font-mono w-20"
                                onBlur={() => setEditingItem(null)}
                              />
                            ) : (
                              <span 
                                className={`text-sm font-mono cursor-pointer hover:bg-gray-100 px-1 rounded ${
                                  item.price_adjustment > 0 ? 'text-green-600' : 
                                  item.price_adjustment < 0 ? 'text-red-600' : 
                                  'text-gray-600'
                                }`}
                                onClick={() => setEditingItem({ groupId: group.id, itemId: item.id })}
                              >
                                {item.price_adjustment > 0 ? '+' : ''}{item.price_adjustment.toFixed(2)} kr
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State - No Mock Data */}
        {modifierGroupsWithItems.length === 0 && !groupsLoading && !groupsError && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="text-center py-12">
              <Tags className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                {t('language') === 'da' ? 'Database er tom - ingen modifier grupper' : 'Database is empty - no modifier groups'}
              </h3>
              <p className="text-blue-700 mb-4">
                {t('language') === 'da' 
                  ? 'Din database er korrekt opsat, men indeholder ingen modifier grupper endnu. Opret din første gruppe for at komme i gang.'
                  : 'Your database is properly set up but contains no modifier groups yet. Create your first group to get started.'
                }
              </p>
              <div className="bg-white p-4 rounded border mb-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('language') === 'da' ? 'Eksempler på modifier grupper:' : 'Examples of modifier groups:'}
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Størrelse</strong> (Variant): Lille, Normal, Stor, XL</li>
                  <li>• <strong>Sovser</strong> (Addon): Ketchup, Mayo, BBQ, Hot Sauce</li>
                  <li>• <strong>Tilbehør</strong> (Addon): Extra Ost, Bacon, Svampe</li>
                </ul>
              </div>
              <Button 
                onClick={() => setShowCreateGroup(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('language') === 'da' ? 'Opret Din Første Gruppe' : 'Create Your First Group'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contextual Save Button */}
        <ContextualSaveButton
          hasChanges={hasChanges}
          onSave={handleSaveChanges}
          onCancel={handleCancelChanges}
          isSaving={updateGroupMutation.isPending || updateModifierMutation.isPending}
          saveText={t('language') === 'da' ? 'Gem Ændringer' : 'Save Changes'}
          cancelText={t('language') === 'da' ? 'Annuller' : 'Cancel'}
        />

        {/* Add Item Modal */}
        <AddModifierItemModal
          isOpen={!!showAddItemModal}
          onClose={() => setShowAddItemModal(null)}
          onSubmit={handleAddItemSubmit}
          groupName={showAddItemModal?.groupName || ''}
          isLoading={createModifierMutation.isPending}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={showDeleteConfirm?.type === 'group' ? handleDeleteGroup : handleDeleteModifier}
          title={showDeleteConfirm?.type === 'group' 
            ? (t('language') === 'da' ? 'Slet Gruppe' : 'Delete Group')
            : (t('language') === 'da' ? 'Slet Item' : 'Delete Item')
          }
          description={showDeleteConfirm?.type === 'group'
            ? (t('language') === 'da' 
                ? 'Er du sikker på at du vil slette denne gruppe og alle dens items?' 
                : 'Are you sure you want to delete this group and all its items?'
              )
            : (t('language') === 'da' 
                ? 'Er du sikker på at du vil slette dette item?' 
                : 'Are you sure you want to delete this item?'
              )
          }
          itemName={showDeleteConfirm?.name || ''}
          isLoading={deleteGroupMutation.isPending || deleteModifierMutation.isPending}
        />

        {/* Info Panel */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              {t('language') === 'da' ? 'Sådan fungerer Addons & Modifiers:' : 'How Addons & Modifiers work:'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">🔘 Variants ({t('language') === 'da' ? 'Vælg én' : 'Choose one'}):</h4>
                <ul className="space-y-1 ml-4">
                  <li>• {t('language') === 'da' ? 'Kunden skal vælge præcis én option' : 'Customer must choose exactly one option'}</li>
                  <li>• {t('language') === 'da' ? 'F.eks. Størrelse: Lille, Normal, Stor' : 'e.g. Size: Small, Normal, Large'}</li>
                  <li>• {t('language') === 'da' ? 'Kan have forskellige priser' : 'Can have different prices'}</li>
                  <li>• {t('language') === 'da' ? 'Klik for at redigere navn og pris' : 'Click to edit name and price'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">☑️ Addons ({t('language') === 'da' ? 'Vælg flere' : 'Choose multiple'}):</h4>
                <ul className="space-y-1 ml-4">
                  <li>• {t('language') === 'da' ? 'Kunden kan vælge 0 eller flere options' : 'Customer can choose 0 or more options'}</li>
                  <li>• {t('language') === 'da' ? 'F.eks. Sovser: Ketchup, Mayo, BBQ' : 'e.g. Sauces: Ketchup, Mayo, BBQ'}</li>
                  <li>• {t('language') === 'da' ? 'Hver option kan have sin egen pris' : 'Each option can have its own price'}</li>
                  <li>• {t('language') === 'da' ? 'Ændringer gemmes automatisk' : 'Changes are saved automatically'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
