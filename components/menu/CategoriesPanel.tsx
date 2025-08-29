'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  useCategories, 
  useProducts,
  useCreateCategory,
  useUpdateCategory,
  useReorderCategories
} from '@/hooks/useMenu'
import { useMenucards } from '@/hooks/useMenu'
import { ChevronRight, ChevronDown, Plus, Search, Package } from 'lucide-react'
import SortList from '@/components/common/SortList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/lib/types/menu'
import React from 'react'

export default React.memo(function CategoriesPanel() {
  const { data: categories = [], isLoading } = useCategories()
  // Note: rootCategories functionality needs to be implemented - for now use categories
  const rootCategories = useMemo(() => categories.filter(cat => !cat.parent_id), [categories])
  const { data: products = [] } = useProducts()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const reorderCategories = useReorderCategories()
  const { data: menucards = [] } = useMenucards()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [creatingSubcategoryFor, setCreatingSubcategoryFor] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '',
    color: '',
    image_url: '',
    display_style: 'emoji' as 'emoji' | 'color' | 'image' | 'text'
  })

  // Toggle category expansion
  const toggleExpanded = useCallback((categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }, [expandedCategories])

  // Start creating subcategory
  const startCreateSubcategory = useCallback((parentId: string) => {
    setCreatingSubcategoryFor(parentId)
    setFormData({ name: '', description: '', emoji: '', color: '', image_url: '', display_style: 'emoji' })
    setIsCreating(true)
  }, [])

  // Get subcategories for a category
  const getSubcategories = useCallback((parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId)
  }, [categories])

  // Filter categories based on search term
  const filterCategories = useCallback((categoriesToFilter: Category[]): Category[] => {
    if (!searchTerm.trim()) return categoriesToFilter

    return categoriesToFilter.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [searchTerm])

  // Get all categories recursively (for search)
  const getAllCategoriesRecursive = useCallback((): Category[] => {
    const allCategories: Category[] = []

    const addCategoryAndChildren = (category: Category) => {
      allCategories.push(category)
      const children = getSubcategories(category.id)
      children.forEach(child => addCategoryAndChildren(child))
    }

    rootCategories.forEach(category => addCategoryAndChildren(category))
    return allCategories
  }, [rootCategories, getSubcategories])

  // Get filtered categories
  const getFilteredCategories = useCallback(() => {
    const allCategories = getAllCategoriesRecursive()
    return filterCategories(allCategories)
  }, [getAllCategoriesRecursive, filterCategories])

  // Check if category matches search (for highlighting)
  const categoryMatchesSearch = useCallback((category: Category) => {
    if (!searchTerm.trim()) return false
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  // Get products for a specific category
  const getProductsForCategory = useMemo(() => (categoryId: string) => {
    return products.filter(product => product.category_id === categoryId)
  }, [products])

  // Get available products (not assigned to any category)
  const getAvailableProducts = useMemo(() => {
    return products.filter(product => !product.category_id)
  }, [products])

  // Add product to category
  const addProductToCategory = useCallback((productId: string, categoryId: string) => {
    // This would need to be implemented in the products repository
    // For now, we'll show a placeholder
    console.log(`Adding product ${productId} to category ${categoryId}`)
  }, [])

  // Remove product from category
  const removeProductFromCategory = useCallback((productId: string) => {
    // This would need to be implemented in the products repository
    // For now, we'll show a placeholder
    console.log(`Removing product ${productId} from category`)
  }, [])

  // Render category item with hierarchy support
  const renderCategoryItem = useCallback((category: Category, level: number = 0) => {
    const hasChildren = category.has_children || getSubcategories(category.id).length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isEmpty = !hasChildren && (!category.product_count || category.product_count === 0)
    const subcategories = getSubcategories(category.id)

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors ${
            level > 0 ? 'ml-6' : ''
          } ${
            categoryMatchesSearch(category) ? 'bg-yellow-50 border-yellow-300' : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(category.id)
            } else if (isEmpty) {
              // Empty category - allow creating subcategory
              startCreateSubcategory(category.id)
            } else {
              startEdit(category)
            }
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Expand/Collapse icon */}
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}

            {/* Category info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {categoryMatchesSearch(category) && searchTerm ? (
                    <span dangerouslySetInnerHTML={{
                      __html: category.name.replace(
                        new RegExp(`(${searchTerm})`, 'gi'),
                        '<mark class="bg-yellow-200">$1</mark>'
                      )
                    }} />
                  ) : (
                    category.name
                  )}
                </h3>
                {level > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Level {level}
                  </Badge>
                )}
                {categoryMatchesSearch(category) && (
                  <Badge variant="secondary" className="text-xs">
                    🔍 Match
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Category</Badge>
                {category.active ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {hasChildren && (
                  <Badge variant="outline" className="text-xs">
                    {subcategories.length} subcategories
                  </Badge>
                )}
                {isEmpty && !hasChildren && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    Empty - Click to add subcategory
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isEmpty && !hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  startCreateSubcategory(category.id)
                }}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Sub
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCategoryForProducts(
                    selectedCategoryForProducts === category.id ? null : category.id
                  )
                }}
                className="text-xs"
              >
                <Package className="w-3 h-3 mr-1" />
                Products ({getProductsForCategory(category.id).length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  startEdit(category)
                }}
                disabled={editingId !== null || isCreating}
                className="text-xs"
              >
                ✏️ Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Render subcategories if expanded */}
        {isExpanded && subcategories.length > 0 && (
          <div className="mt-2">
            {subcategories.map(subcategory => renderCategoryItem(subcategory, level + 1))}
          </div>
        )}

        {/* Render product management */}
        {selectedCategoryForProducts === category.id && (
          <div className="mt-2 ml-6 p-3 border-2 border-green-200 rounded bg-green-50">
            <div className="text-sm font-medium text-green-900 mb-3">
              🛍️ Manage Products in "{category.name}"
            </div>

            {/* Current products in category */}
            {getProductsForCategory(category.id).length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-green-700 mb-2">Current Products:</div>
                <div className="space-y-1">
                  {getProductsForCategory(category.id).map(product => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                      <span>{product.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProductFromCategory(product.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available products to add */}
            {getAvailableProducts().length > 0 && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-2">Add Products:</div>
                <div className="space-y-1">
                  {getAvailableProducts().map(product => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                      <span>{product.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addProductToCategory(product.id, category.id)}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No products available */}
            {getAvailableProducts().length === 0 && getProductsForCategory(category.id).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No products available to manage</p>
              </div>
            )}
          </div>
        )}

        {/* Render subcategory creation form */}
        {creatingSubcategoryFor === category.id && isCreating && (
          <div className={`mt-2 ml-6 p-3 border-2 border-blue-200 rounded bg-blue-50`}>
            <div className="text-sm font-medium text-blue-900 mb-2">
              Create subcategory under "{category.name}"
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (formData.name.trim()) {
                createCategory.mutate({
                  name: formData.name,
                  description: formData.description,
                  emoji: formData.emoji,
                  color: formData.color,
                  image_url: formData.image_url,
                  display_style: formData.display_style,
                  parent_id: category.id
                }, {
                  onSuccess: () => {
                    setIsCreating(false)
                    setCreatingSubcategoryFor(null)
                    setFormData({ name: '', description: '', emoji: '', color: '', image_url: '', display_style: 'emoji' })
                  }
                })
              }
            }} className="space-y-3">
              <div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Subcategory name"
                  required
                  autoFocus
                />
              </div>
              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                />
              </div>
              
              {/* Styling Options for Subcategory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Display Style</label>
                  <select
                    value={formData.display_style}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_style: e.target.value as 'emoji' | 'color' | 'image' | 'text' }))}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="emoji">Emoji</option>
                    <option value="color">Color</option>
                    <option value="image">Image</option>
                    <option value="text">Text Only</option>
                  </select>
                </div>
                
                {formData.display_style === 'emoji' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Emoji</label>
                    <Input
                      value={formData.emoji}
                      onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                      placeholder="🍕 🍰 🍔"
                      className="text-xs"
                    />
                  </div>
                )}
                
                {formData.display_style === 'color' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Color</label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-8"
                    />
                  </div>
                )}
                
                {formData.display_style === 'image' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? 'Creating...' : 'Create Subcategory'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false)
                    setCreatingSubcategoryFor(null)
                    setFormData({ name: '', description: '', emoji: '', color: '', image_url: '', display_style: 'emoji' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }, [expandedCategories, searchTerm, selectedCategoryForProducts, getSubcategories, categoryMatchesSearch, toggleExpanded, startCreateSubcategory, getProductsForCategory, getAvailableProducts, removeProductFromCategory, addProductToCategory])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      await createCategory.mutateAsync({
        name: formData.name,
        description: formData.description,
        emoji: formData.emoji,
        color: formData.color,
        image_url: formData.image_url,
        display_style: formData.display_style
      })
      setFormData({ name: '', description: '', emoji: '', color: '', image_url: '', display_style: 'emoji' })
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.name.trim()) return

    try {
      await updateCategory.mutateAsync({
        id: editingId,
        updates: {
          name: formData.name,
          description: formData.description,
          emoji: formData.emoji,
          color: formData.color,
          image_url: formData.image_url,
          display_style: formData.display_style
        }
      })
      setFormData({ name: '', description: '', emoji: '', color: '', image_url: '', display_style: 'emoji' })
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || '',
      color: category.color || '',
      image_url: category.image_url || '',
      display_style: category.display_style || 'emoji'
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({ name: '', description: '' })
  }

  const handleReorder = (newOrder: string[]) => {
    reorderCategories.mutate(newOrder)
  }

  if (isLoading) {
    return <div className="p-4">Loading categories...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Button 
          onClick={() => setIsCreating(true)}
          disabled={isCreating || editingId !== null}
        >
          Add Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Category' : 'Create New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Category description (optional)"
                  rows={2}
                />
              </div>
              
              {/* Styling Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Style</label>
                  <select
                    value={formData.display_style}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_style: e.target.value as 'emoji' | 'color' | 'image' | 'text' }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="emoji">Emoji</option>
                    <option value="color">Color</option>
                    <option value="image">Image</option>
                    <option value="text">Text Only</option>
                  </select>
                </div>
                
                {formData.display_style === 'emoji' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Emoji</label>
                    <Input
                      value={formData.emoji}
                      onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                      placeholder="🍕 🍰 🍔"
                    />
                  </div>
                )}
                
                {formData.display_style === 'color' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10"
                    />
                  </div>
                )}
                
                {formData.display_style === 'image' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
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

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🔍 Search & Hierarchy:</strong> Use the search bar to filter categories.
              Click categories with children to expand/collapse. Click empty categories to create subcategories.
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>🛍️ Products:</strong> Click "Products" button on any category to add/remove products.
            </p>
          </div>

          {/* Categories List */}
          {getFilteredCategories().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">
                {searchTerm ? 'No categories match your search.' : 'No categories yet. Create your first category above.'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(searchTerm ? getFilteredCategories() : rootCategories).map(category => renderCategoryItem(category))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
