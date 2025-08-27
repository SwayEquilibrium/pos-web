'use client'

import { useState } from 'react'
import { useModifierGroups, useModifierGroupsWithModifiers, useCreateModifierGroup, useUpdateModifierGroup, useDeleteModifierGroup, useCreateModifier, useUpdateModifier, useDeleteModifier, useMoveModifierGroup } from '@/hooks/menu/useModifierGroups'
import { useProducts } from '@/hooks/menu/useProducts'
import SortList from '@/components/common/SortList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronDown, Plus, Settings, Trash2 } from 'lucide-react'

import type { ModifierGroup, ModifierGroupWithModifiers, Modifier } from '@/lib/types/menu'

export default function ModifiersPanel() {
  const { data: modifierGroups = [], isLoading, error } = useModifierGroups()
  const { data: modifierGroupsWithModifiers = [] } = useModifierGroupsWithModifiers()
  const { data: products = [] } = useProducts()

  // Mutations
  const createModifierGroup = useCreateModifierGroup()
  const updateModifierGroup = useUpdateModifierGroup()
  const deleteModifierGroup = useDeleteModifierGroup()
  const createModifier = useCreateModifier()
  const updateModifier = useUpdateModifier()
  const deleteModifier = useDeleteModifier()
  const { moveUp, moveDown } = useMoveModifierGroup()

  // State
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [creatingModifierFor, setCreatingModifierFor] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_select: 0,
    max_select: 1
  })

  // Toggle group expansion
  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Handle creating modifier group
  const handleCreateModifierGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      await createModifierGroup.mutateAsync({
        name: formData.name,
        description: formData.description,
        min_select: formData.min_select,
        max_select: formData.max_select
      })
      setIsCreating(false)
      setFormData({ name: '', description: '', min_select: 0, max_select: 1 })
    } catch (error) {
      console.error('Failed to create modifier group:', error)
    }
  }

  // Handle updating modifier group
  const handleUpdateModifierGroup = async (groupId: string, updates: Partial<typeof formData>) => {
    try {
      await updateModifierGroup.mutateAsync({
        id: groupId,
        updates
      })
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update modifier group:', error)
    }
  }

  // Handle deleting modifier group
  const handleDeleteModifierGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this modifier group? This will also delete all modifiers in this group.')) {
      return
    }

    try {
      await deleteModifierGroup.mutateAsync(groupId)
    } catch (error) {
      console.error('Failed to delete modifier group:', error)
    }
  }

  // Handle creating modifier
  const handleCreateModifier = async (groupId: string, modifierData: { name: string; description?: string; price_delta: number }) => {
    try {
      await createModifier.mutateAsync({
        group_id: groupId,
        ...modifierData
      })
      setCreatingModifierFor(null)
    } catch (error) {
      console.error('Failed to create modifier:', error)
    }
  }

  // Get modifiers for a group
  const getModifiersForGroup = (groupId: string): Modifier[] => {
    const groupWithModifiers = modifierGroupsWithModifiers.find(group => group.id === groupId)
    return groupWithModifiers?.modifiers || []
  }

  // Get products that use a modifier group
  const getProductsUsingModifierGroup = (groupId: string) => {
    return products.filter(product =>
      product.modifier_groups?.some(mg => mg.group_id === groupId)
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading modifiers: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Modifiers & Add-ons</h2>
          <p className="text-gray-600">Create customizable options for your products</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating || editingId !== null}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Modifier Group
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Modifier Group' : 'Create New Modifier Group'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? (e) => {
              e.preventDefault()
              handleUpdateModifierGroup(editingId, formData)
            } : handleCreateModifierGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Size Options, Extra Toppings"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Select</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_select}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_select: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Select</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_select}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_select: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createModifierGroup.isPending || updateModifierGroup.isPending}
                >
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingId(null)
                    setFormData({ name: '', description: '', min_select: 0, max_select: 1 })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Modifier Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier Groups ({modifierGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {modifierGroups.length === 0 ? (
            <p className="text-gray-500">No modifier groups yet. Create your first modifier group above.</p>
          ) : (
            <SortList
              items={modifierGroups.map(group => ({
                id: group.id,
                name: group.name,
                sort_index: group.sort_index
              }))}
              onMoveUp={(id) => {
                moveUp(id).catch(error => {
                  console.error('Failed to move modifier group up:', error)
                })
              }}
              onMoveDown={(id) => {
                moveDown(id).catch(error => {
                  console.error('Failed to move modifier group down:', error)
                })
              }}
              renderItem={(item, index) => {
                const group = modifierGroups.find(g => g.id === item.id)
                const modifiers = getModifiersForGroup(group?.id || '')
                const productsUsing = group ? getProductsUsingModifierGroup(group.id) : []
                const isExpanded = expandedGroups.has(group?.id || '')

                if (!group) return null

                return (
                  <div key={group.id}>
                    <div
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpanded(group.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {modifiers.length > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{group.name}</h3>
                            {group.active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-600">{group.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {modifiers.length} modifiers
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Min: {group.min_select}, Max: {group.max_select}
                            </Badge>
                            {productsUsing.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Used by {productsUsing.length} products
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCreatingModifierFor(group.id)
                          }}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(group.id)
                            setFormData({
                              name: group.name,
                              description: group.description || '',
                              min_select: group.min_select,
                              max_select: group.max_select
                            })
                          }}
                          disabled={editingId !== null || isCreating}
                          className="text-xs"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteModifierGroup(group.id)
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Modifiers list */}
                    {isExpanded && modifiers.length > 0 && (
                      <div className="mt-2 ml-6 space-y-2">
                        {modifiers.map(modifier => (
                          <div key={modifier.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div>
                              <span className="font-medium">{modifier.name}</span>
                              {modifier.description && (
                                <span className="text-gray-600 ml-2">- {modifier.description}</span>
                              )}
                              <span className="ml-2 text-green-600 font-medium">
                                {modifier.price_delta >= 0 ? '+' : ''}{modifier.price_delta}€
                              </span>
                            </div>
                            <Badge variant={modifier.active ? 'default' : 'secondary'}>
                              {modifier.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add modifier form */}
                    {creatingModifierFor === group.id && (
                      <div className="mt-2 ml-6 p-3 border-2 border-blue-200 rounded bg-blue-50">
                        <div className="text-sm font-medium text-blue-900 mb-2">
                          Add modifier to "{group.name}"
                        </div>
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          const form = e.target as HTMLFormElement
                          const name = (form.elements.namedItem('name') as HTMLInputElement).value
                          const description = (form.elements.namedItem('description') as HTMLInputElement).value
                          const priceDelta = parseFloat((form.elements.namedItem('priceDelta') as HTMLInputElement).value) || 0

                          if (name.trim()) {
                            handleCreateModifier(group.id, {
                              name: name.trim(),
                              description: description.trim() || undefined,
                              price_delta: priceDelta
                            })
                          }
                        }} className="space-y-3">
                          <div>
                            <Input
                              name="name"
                              placeholder="Modifier name"
                              required
                              autoFocus
                            />
                          </div>
                          <div>
                            <Input
                              name="description"
                              placeholder="Description (optional)"
                            />
                          </div>
                          <div>
                            <Input
                              name="priceDelta"
                              type="number"
                              step="0.01"
                              placeholder="Price adjustment (€)"
                              defaultValue="0"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm">
                              Add Modifier
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCreatingModifierFor(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )
              }}
              disabled={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
