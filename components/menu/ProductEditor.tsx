'use client'

import { useState, useEffect } from 'react'
import { useProductEditor } from '@/hooks/menu/useProducts'
import { useCategories } from '@/hooks/menu/useCategories'
import { useProductGroups } from '@/hooks/menu/useProductGroups'
import { useTaxCodes } from '@/hooks/menu/useTaxCodes'
import { useModifierGroups } from '@/hooks/menu/useModifierGroups'
import Collapsible from '@/components/common/Collapsible'
import SortList from '@/components/common/SortList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Product, ProductPrice, ModifierGroup } from '@/lib/types/menu'

interface ProductEditorProps {
  productId: string | null
  onClose: () => void
}

export default function ProductEditor({ productId, onClose }: ProductEditorProps) {
  const { 
    product, 
    pricing, 
    isLoading: productLoading, 
    saveProduct, 
    isSaving 
  } = useProductEditor(productId)
  const { data: categories = [] } = useCategories()
  const { data: productGroups = [], createProductGroup } = useProductGroups()
  const { data: taxCodes = [] } = useTaxCodes()
  const { 
    data: modifierGroups = [], 
    attachGroupToProduct, 
    detachGroupFromProduct,
    reorderProductModifierGroups 
  } = useModifierGroups()

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    productGroupId: '',
    description: '',
    dineInPrice: '',
    dineInTaxId: '',
    takeawayPrice: '',
    takeawayTaxId: '',
  })

  const [attachedGroups, setAttachedGroups] = useState<ModifierGroup[]>([])
  const [availableGroups, setAvailableGroups] = useState<ModifierGroup[]>([])
  const [showNewProductGroupForm, setShowNewProductGroupForm] = useState(false)
  const [newProductGroupName, setNewProductGroupName] = useState('')

  // Load product data when productId changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        categoryId: product.category_id || '',
        productGroupId: product.product_group_id || '',
        description: product.description || '',
        dineInPrice: pricing?.dine_in?.price?.toString() || '',
        dineInTaxId: pricing?.dine_in?.tax_code_id || '',
        takeawayPrice: pricing?.takeaway?.price?.toString() || '',
        takeawayTaxId: pricing?.takeaway?.tax_code_id || '',
      })
      
      // Load attached modifier groups
      if (product.modifier_groups) {
        setAttachedGroups(product.modifier_groups)
        setAvailableGroups(modifierGroups.filter(
          group => !product.modifier_groups?.some(attached => attached.id === group.id)
        ))
      }
    } else if (productId === null) {
      // Reset form for new product
      setFormData({
        name: '',
        categoryId: '',
        productGroupId: '',
        description: '',
        dineInPrice: '',
        dineInTaxId: taxCodes[0]?.id || '',
        takeawayPrice: '',
        takeawayTaxId: taxCodes[0]?.id || '',
      })
      setAttachedGroups([])
      setAvailableGroups(modifierGroups)
    }
  }, [product, pricing, productId, modifierGroups, taxCodes])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      const productData = {
        name: formData.name,
        category_id: formData.categoryId || null,
        product_group_id: formData.productGroupId || null,
        description: formData.description,
        prices: [
          {
            context: 'dine_in' as const,
            price: parseFloat(formData.dineInPrice) || 0,
            tax_code_id: formData.dineInTaxId
          },
          {
            context: 'takeaway' as const,
            price: parseFloat(formData.takeawayPrice) || 0,
            tax_code_id: formData.takeawayTaxId
          }
        ]
      }

      await saveProduct(productData)
      onClose()
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleAttachGroup = async (groupId: string) => {
    if (!productId) return

    try {
      await attachGroupToProduct.mutateAsync({
        productId,
        groupId,
        sortIndex: attachedGroups.length,
        isRequired: false,
      })
      
      // Update local state
      const group = availableGroups.find(g => g.id === groupId)
      if (group) {
        setAttachedGroups(prev => [...prev, group])
        setAvailableGroups(prev => prev.filter(g => g.id !== groupId))
      }
    } catch (error) {
      console.error('Failed to attach modifier group:', error)
    }
  }

  const handleDetachGroup = async (groupId: string) => {
    if (!productId) return

    try {
      await detachGroupFromProduct.mutateAsync({ productId, groupId })
      
      // Update local state
      const group = attachedGroups.find(g => g.id === groupId)
      if (group) {
        setAttachedGroups(prev => prev.filter(g => g.id !== groupId))
        setAvailableGroups(prev => [...prev, group])
      }
    } catch (error) {
      console.error('Failed to detach modifier group:', error)
    }
  }

  const handleReorderGroups = (newOrder: string[]) => {
    if (!productId) return
    reorderProductModifierGroups.mutate({ productId, groupIds: newOrder })
  }

  const handleCreateNewProductGroup = async () => {
    if (!newProductGroupName.trim()) return

    try {
      const newGroup = await createProductGroup.mutateAsync({
        name: newProductGroupName.trim(),
        description: `Custom product group: ${newProductGroupName.trim()}`,
        sort_order: productGroups.length + 1,
        color: '#10B981' // Green color for new groups
      })

      // Select the newly created group
      setFormData(prev => ({ ...prev, productGroupId: newGroup.id }))
      
      // Reset form
      setNewProductGroupName('')
      setShowNewProductGroupForm(false)
    } catch (error) {
      console.error('Failed to create product group:', error)
    }
  }

  if (productLoading) {
    return <div className="p-4">Loading product...</div>
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {productId ? 'Edit Product' : 'Create New Product'}
        </h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Product Group</label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewProductGroupForm(!showNewProductGroupForm)}
                    className="text-xs h-7"
                  >
                    + New Group
                  </Button>
                </div>
                
                {showNewProductGroupForm && (
                  <div className="mb-3 p-3 border rounded-md bg-gray-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new product group name"
                        value={newProductGroupName}
                        onChange={(e) => setNewProductGroupName(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateNewProductGroup()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateNewProductGroup}
                        disabled={!newProductGroupName.trim() || createProductGroup.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createProductGroup.isPending ? '...' : 'Create'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewProductGroupForm(false)
                          setNewProductGroupName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a new product group to organize your products better
                    </p>
                  </div>
                )}
                
                <select
                  value={formData.productGroupId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productGroupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product group</option>
                  {productGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prices */}
        <Collapsible title="Prices" defaultOpen={true}>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dine-in Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dineInPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, dineInPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dine-in VAT</label>
                  <select
                    value={formData.dineInTaxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, dineInTaxId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {taxCodes.map(tax => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Takeaway Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.takeawayPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, takeawayPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Takeaway VAT</label>
                  <select
                    value={formData.takeawayTaxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, takeawayTaxId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {taxCodes.map(tax => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </Collapsible>

        {/* Modifiers - only show for existing products */}
        {productId && (
          <Collapsible title="Addons & Modifiers" defaultOpen={false}>
            <Card>
              <CardContent className="space-y-4 pt-4">
                {/* Available Groups */}
                {availableGroups.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Available Modifier Groups</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableGroups.map(group => (
                        <div key={group.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{group.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {group.type}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAttachGroup(group.id)}
                            disabled={attachGroupToProduct.isPending}
                          >
                            Attach
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Groups */}
                {attachedGroups.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attached Modifier Groups</h4>
                    <SortList
                      items={attachedGroups.map(group => ({
                        id: group.id,
                        content: (
                          <div className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{group.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {group.type}
                              </Badge>
                              {group.description && (
                                <p className="text-sm text-gray-600">{group.description}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDetachGroup(group.id)}
                              disabled={detachGroupFromProduct.isPending}
                            >
                              Detach
                            </Button>
                          </div>
                        )
                      }))}
                      onReorder={handleReorderGroups}
                      disabled={reorderProductModifierGroups.isPending}
                    />
                  </div>
                )}

                {attachedGroups.length === 0 && availableGroups.length === 0 && (
                  <p className="text-gray-500">No modifier groups available. Create modifier groups first.</p>
                )}
              </CardContent>
            </Card>
          </Collapsible>
        )}

        {/* Save Button */}
        <div className="flex gap-2">
          <Button 
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
