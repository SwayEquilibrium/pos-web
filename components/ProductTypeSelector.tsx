/**
 * Product Type Selector Component
 * Simple dropdown to assign product types to products
 */

'use client'

import { useState } from 'react'
import { useProductTypes, useProductTypeAssignments, useUpdateProductType, useCreateProductType } from '@/hooks/useProductTypes'
import { Button } from '@/components/ui/button'

interface ProductTypeSelectorProps {
  productId: string
  productName?: string
  onTypeChanged?: (typeName: string) => void
}

export default function ProductTypeSelector({ productId, productName, onTypeChanged }: ProductTypeSelectorProps) {
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  const { data: productTypes, isLoading: typesLoading } = useProductTypes()
  const { data: assignments, isLoading: assignmentsLoading } = useProductTypeAssignments(productId)
  const updateProductType = useUpdateProductType()
  const createProductType = useCreateProductType()

  const currentAssignment = assignments?.find(a => a.is_primary)
  const currentType = productTypes?.find(pt => pt.id === currentAssignment?.product_type_id)

  const handleTypeChange = async (productTypeId: string) => {
    try {
      await updateProductType.mutateAsync({ productId, productTypeId })
      
      const selectedType = productTypes?.find(pt => pt.id === productTypeId)
      if (selectedType && onTypeChanged) {
        onTypeChanged(selectedType.code)
      }
    } catch (error) {
      alert(`Failed to update product type: ${error}`)
    }
  }

  const handleCreateNewType = async () => {
    if (!newTypeName.trim()) return

    try {
      const newType = await createProductType.mutateAsync({
        name: newTypeName.trim(),
        code: newTypeName.toLowerCase().replace(/\s+/g, '_'),
        color: '#3B82F6' // Blue default
      })

      // Automatically assign the new type to this product
      await updateProductType.mutateAsync({ productId, productTypeId: newType.id })
      
      setNewTypeName('')
      setIsCreatingType(false)
      
      if (onTypeChanged) {
        onTypeChanged(newType.code)
      }
    } catch (error) {
      alert(`Failed to create product type: ${error}`)
    }
  }

  if (typesLoading || assignmentsLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Product Type {productName && <span className="text-muted-foreground">for {productName}</span>}
      </label>
      
      {!isCreatingType ? (
        <div className="flex gap-2">
          <select
            value={currentType?.id || ''}
            onChange={(e) => e.target.value && handleTypeChange(e.target.value)}
            className="flex-1 p-2 border rounded-md text-sm"
            disabled={updateProductType.isPending}
          >
            <option value="">Select type...</option>
            {productTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingType(true)}
            className="text-xs"
          >
            + New
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="New type name (e.g., Appetizers)"
            className="flex-1 p-2 border rounded-md text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateNewType()}
          />
          
          <Button
            type="button"
            size="sm"
            onClick={handleCreateNewType}
            disabled={!newTypeName.trim() || createProductType.isPending}
            className="text-xs"
          >
            {createProductType.isPending ? 'Creating...' : 'Create'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreatingType(false)
              setNewTypeName('')
            }}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {currentType && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: currentType.color }}
          />
          <span>Current: {currentType.name}</span>
        </div>
      )}

      {updateProductType.isPending && (
        <div className="text-xs text-muted-foreground">Updating...</div>
      )}
    </div>
  )
}
