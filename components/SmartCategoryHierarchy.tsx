'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DynamicIcon } from '@/lib/iconMapping'
import { useRootCategories, useSubcategories, useCategoryBreadcrumbs } from '@/hooks/useCatalog'
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useMenuManagement'
import { ChevronRight, Plus, Edit, Trash2, ArrowLeft, Home, FolderOpen, Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  parent_id?: string | null
  sort_index: number
  print_sort_index?: number
  color?: string
  emoji?: string
  display_style?: string
  image_url?: string
  image_thumbnail_url?: string
  has_children: boolean
  product_count: number
  child_categories?: number
  level?: number
  full_path?: string
}

interface NavigationLevel {
  id: string | null
  name: string
  level: number
}

interface SmartCategoryHierarchyProps {
  onCategorySelect?: (category: Category) => void
  onProductsView?: (categoryId: string, categoryName: string) => void
  showProductCounts?: boolean
  maxLevels?: number
}

export default function SmartCategoryHierarchy({ 
  onCategorySelect, 
  onProductsView,
  showProductCounts = true,
  maxLevels = 5 
}: SmartCategoryHierarchyProps) {
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([
    { id: null, name: 'Master Categories', level: 0 }
  ])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    emoji: '📁',
    color: '#3B82F6',
    display_style: 'emoji' as const,
    sort_index: 0
  })

  const currentLevel = navigationStack[navigationStack.length - 1]
  const currentParentId = currentLevel.id

  // Data fetching
  const { data: rootCategories, isLoading: loadingRoot } = useRootCategories()
  const { data: subcategories, isLoading: loadingSubcategories } = useSubcategories(currentParentId)
  const { data: breadcrumbs } = useCategoryBreadcrumbs(currentParentId || undefined)

  // Mutations
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  // Get current categories to display
  const currentCategories = currentParentId === null ? rootCategories : subcategories
  const isLoading = currentParentId === null ? loadingRoot : loadingSubcategories

  // Navigate to subcategory
  const navigateToCategory = (category: Category) => {
    if (category.has_children && navigationStack.length < maxLevels) {
      setNavigationStack(prev => [...prev, {
        id: category.id,
        name: category.name,
        level: prev.length
      }])
      onCategorySelect?.(category)
    } else if (category.product_count > 0) {
      // Navigate to products if no subcategories but has products
      onProductsView?.(category.id, category.name)
    }
  }

  // Navigate back one level
  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1))
    }
  }

  // Navigate to root
  const navigateToRoot = () => {
    setNavigationStack([{ id: null, name: 'Master Categories', level: 0 }])
  }

  // Navigate to specific breadcrumb level
  const navigateToBreadcrumb = (targetLevel: number) => {
    setNavigationStack(prev => prev.slice(0, targetLevel + 1))
  }

  // Handle create category
  const handleCreateCategory = async () => {
    if (!newCategoryForm.name.trim()) return

    try {
      await createCategory.mutateAsync({
        name: newCategoryForm.name,
        parent_id: currentParentId,
        emoji: newCategoryForm.emoji,
        color: newCategoryForm.color,
        display_style: newCategoryForm.display_style,
        sort_index: newCategoryForm.sort_index
      })
      
      setShowCreateDialog(false)
      setNewCategoryForm({
        name: '',
        emoji: '📁',
        color: '#3B82F6',
        display_style: 'emoji',
        sort_index: 0
      })
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryForm({
      name: category.name,
      emoji: category.emoji || '📁',
      color: category.color || '#3B82F6',
      display_style: (category.display_style || 'emoji') as 'emoji',
      sort_index: category.sort_index
    })
    setShowEditDialog(true)
  }

  // Handle update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryForm.name.trim()) return

    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: newCategoryForm.name,
        emoji: newCategoryForm.emoji,
        color: newCategoryForm.color,
        display_style: newCategoryForm.display_style,
        sort_index: newCategoryForm.sort_index
      })
      
      setShowEditDialog(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      await deleteCategory.mutateAsync(category.id)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToRoot}
              className="h-6 px-2"
            >
              <Home className="w-3 h-3" />
            </Button>
            
            {navigationStack.map((level, index) => (
              <div key={level.level} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToBreadcrumb(index)}
                  className="h-6 px-2 text-xs"
                  disabled={index === navigationStack.length - 1}
                >
                  {level.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Current Level Title */}
          <div className="flex items-center gap-3">
            {navigationStack.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="w-6 h-6" />
              {currentLevel.name}
            </h2>
            
            {showProductCounts && currentCategories && (
              <Badge variant="secondary">
                {currentCategories.length} categories
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Name *</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryEmoji">Emoji</Label>
                    <Input
                      id="categoryEmoji"
                      value={newCategoryForm.emoji}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                      placeholder="📁"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryColor">Color</Label>
                    <Input
                      id="categoryColor"
                      type="color"
                      value={newCategoryForm.color}
                      onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortIndex">Sort Order</Label>
                  <Input
                    id="sortIndex"
                    type="number"
                    value={newCategoryForm.sort_index}
                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, sort_index: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                    {createCategory.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentCategories && currentCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCategories.map((category) => (
            <Card 
              key={category.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
              onClick={() => navigateToCategory(category)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Category Icon */}
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  >
                    <DynamicIcon 
                      name={category.emoji || 'folder'} 
                      size={24} 
                      className="text-white"
                    />
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {category.has_children && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {category.child_categories || 0} subcategories
                        </span>
                      )}
                      
                      {showProductCounts && category.product_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {category.product_count} products
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Arrow */}
                  <div className="flex items-center gap-1">
                    {category.has_children ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : category.product_count > 0 ? (
                      <Package className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <div className="w-5 h-5"></div>
                    )}
                  </div>
                </div>

                {/* Level Indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-black/10 px-2 py-1 rounded">
                    Level {currentLevel.level + 1}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditCategory(category)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {currentLevel.level === 0 
                ? 'Create your first category to get started' 
                : `Create a subcategory under ${currentLevel.name}`
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Name *</Label>
              <Input
                id="editCategoryName"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryEmoji">Emoji</Label>
                <Input
                  id="editCategoryEmoji"
                  value={newCategoryForm.emoji}
                  onChange={(e) => setNewCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="📁"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCategoryColor">Color</Label>
                <Input
                  id="editCategoryColor"
                  type="color"
                  value={newCategoryForm.color}
                  onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSortIndex">Sort Order</Label>
              <Input
                id="editSortIndex"
                type="number"
                value={newCategoryForm.sort_index}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, sort_index: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCategory} disabled={updateCategory.isPending}>
                {updateCategory.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}