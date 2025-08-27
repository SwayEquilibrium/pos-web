'use client'

import { useState } from 'react'
import { useMenucards } from '@/hooks/menu/useMenucards'
import { useCategories } from '@/hooks/menu/useCategories'
import SortList from '@/components/common/SortList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Menucard } from '@/lib/types/menu'

export default function MenucardsPanel() {
  const { data: menucards = [], isLoading, createMenucard, updateMenucard, reorderMenucards } = useMenucards()
  const { data: categories = [] } = useCategories()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryIds: [] as string[],
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      await createMenucard.mutateAsync({
        name: formData.name,
        description: formData.description,
        categoryIds: formData.categoryIds,
      })
      setFormData({ name: '', description: '', categoryIds: [] })
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create menucard:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.name.trim()) return

    try {
      await updateMenucard.mutateAsync({
        id: editingId,
        updates: {
          name: formData.name,
          description: formData.description,
        }
      })
      setFormData({ name: '', description: '', categoryIds: [] })
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update menucard:', error)
    }
  }

  const startEdit = (menucard: Menucard) => {
    setEditingId(menucard.id)
    setFormData({
      name: menucard.name,
      description: menucard.description || '',
      categoryIds: [], // TODO: Load existing categories for this menucard
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({ name: '', description: '', categoryIds: [] })
  }

  const handleReorder = (newOrder: string[]) => {
    reorderMenucards.mutate(newOrder)
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: checked 
        ? [...prev.categoryIds, categoryId]
        : prev.categoryIds.filter(id => id !== categoryId)
    }))
  }

  if (isLoading) {
    return <div className="p-4">Loading menucards...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Menu Cards</h2>
        <Button 
          onClick={() => setIsCreating(true)}
          disabled={isCreating || editingId !== null}
        >
          Add Menu Card
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Menu Card' : 'Create New Menu Card'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Menu card name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Menu card description (optional)"
                  rows={2}
                />
              </div>
              
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    📂 Assign Categories to this Menu Card
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center space-x-3 p-2 bg-white rounded hover:bg-gray-50">
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={formData.categoryIds.includes(category.id)}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                        />
                        <label 
                          htmlFor={`cat-${category.id}`} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          <span className="font-medium">{category.name}</span>
                          {category.description && (
                            <span className="text-gray-500 text-xs ml-2">- {category.description}</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Only selected categories will appear in this menu card
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={createMenucard.isPending || updateMenucard.isPending}
                >
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Menu Cards List */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Cards ({menucards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {menucards.length === 0 ? (
            <p className="text-gray-500">No menu cards yet. Create your first menu card above.</p>
          ) : (
            <SortList
              items={menucards.map(menucard => ({
                id: menucard.id,
                name: menucard.name,
                sort_index: menucard.sort_index
              }))}
              onMoveUp={(id) => {
                const currentIndex = menucards.findIndex(m => m.id === id);
                if (currentIndex > 0) {
                  const newOrder = [...menucards];
                  [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                  reorderMenucards.mutate(newOrder.map(m => m.id));
                }
              }}
              onMoveDown={(id) => {
                const currentIndex = menucards.findIndex(m => m.id === id);
                if (currentIndex < menucards.length - 1) {
                  const newOrder = [...menucards];
                  [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                  reorderMenucards.mutate(newOrder.map(m => m.id));
                }
              }}
              renderItem={(item, index) => {
                const menucard = menucards.find(m => m.id === item.id);
                if (!menucard) return null;

                return (
                  <div
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => startEdit(menucard)}
                  >
                    <div>
                      <h3 className="font-medium">{menucard.name}</h3>
                      {menucard.description && (
                        <p className="text-sm text-gray-600">{menucard.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">Menu Card</Badge>
                        {menucard.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(menucard)
                        }}
                        disabled={editingId !== null || isCreating}
                        className="text-xs"
                      >
                        ✏️ Edit
                      </Button>
                    </div>
                  </div>
                );
              }}
              disabled={reorderMenucards.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
