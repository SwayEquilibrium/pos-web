'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useProductModifiers, groupModifiersByGroup, calculateItemPrice, type ProductModifier, type SelectedModifier } from '@/hooks/useMenu'
import { DynamicIcon } from '@/lib/iconMapping'
import { ShoppingCart, X, Check, AlertCircle } from 'lucide-react'

interface ModifierSelectorProps {
  productId: string
  productName: string
  basePrice: number
  onConfirm: (modifiers: SelectedModifier[], totalPrice: number) => void
  onCancel: () => void
}

export default function ModifierSelector({ 
  product, 
  onConfirm, 
  onCancel 
}: {
  product: { id: string; name: string; price: number; is_open_price: boolean }
  onConfirm: (modifiers: SelectedModifier[], totalPrice: number) => void
  onCancel: () => void
}) {
  const { data: productModifiers, isLoading } = useProductModifiers(product.id)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [errors, setErrors] = useState<string[]>([])

  // Debug logging
  useEffect(() => {
    console.log(`[ModifierSelector] Product: ${product.name} (${product.id})`)
    console.log(`[ModifierSelector] Loading: ${isLoading}`)
    console.log(`[ModifierSelector] Product Modifiers:`, productModifiers)
    console.log(`[ModifierSelector] Modifier Groups:`, productModifiers ? groupModifiersByGroup(productModifiers) : 'No modifiers')
  }, [product, productModifiers, isLoading])

  // Group modifiers by their groups
  const modifierGroups = productModifiers ? groupModifiersByGroup(productModifiers) : {}
  const groupIds = Object.keys(modifierGroups)
  
  console.log(`[ModifierSelector] Modifier Groups:`, modifierGroups)
  console.log(`[ModifierSelector] Group IDs:`, groupIds)

  // Calculate total price
  const totalPrice = calculateItemPrice(product.price, selectedModifiers)

  // Reset selection when product changes
  useEffect(() => {
    setSelectedModifiers([])
    setErrors([])
  }, [product.id])

  const handleModifierSelect = (modifier: ProductModifier, groupType: 'variant' | 'addon') => {
    setSelectedModifiers(prev => {
      if (groupType === 'variant') {
        // For variants, replace any existing selection from the same group
        const filtered = prev.filter(m => {
          const existingModifier = productModifiers?.find(pm => pm.modifier_id === m.modifier_id)
          return existingModifier?.group_id !== modifier.group_id
        })
        
        return [
          ...filtered,
          {
            modifier_id: modifier.modifier_id,
            modifier_name: modifier.modifier_name,
            price_adjustment: modifier.modifier_price
          }
        ]
      } else {
        // For addons, toggle selection
        const exists = prev.find(m => m.modifier_id === modifier.modifier_id)
        if (exists) {
          return prev.filter(m => m.modifier_id !== modifier.modifier_id)
        } else {
          return [
            ...prev,
            {
              modifier_id: modifier.modifier_id,
              modifier_name: modifier.modifier_name,
              price_adjustment: modifier.modifier_price
            }
          ]
        }
      }
    })
  }

  const isModifierSelected = (modifierId: string): boolean => {
    return selectedModifiers.some(m => m.modifier_id === modifierId)
  }

  const validateSelection = (): boolean => {
    const newErrors: string[] = []

    // Check required groups
    groupIds.forEach(groupId => {
      const group = modifierGroups[groupId]
      const firstModifier = group[0]
      
      if (firstModifier?.group_required) {
        const hasSelection = selectedModifiers.some(selected => {
          return group.some(modifier => modifier.modifier_id === selected.modifier_id)
        })
        
        if (!hasSelection) {
          newErrors.push(`Du skal vælge fra "${firstModifier.group_name}"`)
        }
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleConfirm = () => {
    if (validateSelection()) {
      onConfirm(selectedModifiers, totalPrice)
    }
  }

  // Removed automatic onConfirm call to prevent duplicates
  // User must manually click the "Add to Basket" button

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Indlæser tilvalg...</div>
        </CardContent>
      </Card>
    )
  }

  if (!productModifiers || productModifiers.length === 0) {
    console.log('[ModifierSelector] No modifiers found, showing fallback UI')
    // Show simple "Add to Basket" button for products without modifiers
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Add {product.name} to Basket</span>
            <Badge variant="outline" className="text-lg font-bold">
              {product.price.toFixed(0)} kr.
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-muted-foreground">
            <p>This product has no customization options.</p>
            <p className="text-sm">Click below to add it directly to your basket.</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => onConfirm([], product.price)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart size={16} className="mr-2" />
              Add to Basket - {product.price.toFixed(0)} kr.
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tilpas din {product.name}</span>
          <Badge variant="outline" className="text-lg font-bold">
            {totalPrice.toFixed(0)} kr.
          </Badge>
        </CardTitle>
        {product.price !== totalPrice && (
          <p className="text-sm text-muted-foreground">
            Grundpris: {product.price.toFixed(0)} kr. (+{(totalPrice - product.price).toFixed(0)} kr. i tilvalg)
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Manglende valg:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modifier Groups */}
        {groupIds.map(groupId => {
          const group = modifierGroups[groupId]
          const firstModifier = group[0]
          const groupType = firstModifier.group_type
          const isRequired = firstModifier.group_required

          return (
            <div key={groupId} className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">
                  {firstModifier.group_name}
                </Label>
                {isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    Påkrævet
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {groupType === 'variant' ? 'Vælg én' : 'Vælg flere'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.map(modifier => {
                  const isSelected = isModifierSelected(modifier.modifier_id)
                  const priceText = modifier.modifier_price === 0 
                    ? '' 
                    : modifier.modifier_price > 0 
                      ? ` (+${modifier.modifier_price.toFixed(0)} kr.)` 
                      : ` (${modifier.modifier_price.toFixed(0)} kr.)`

                  return (
                    <Button
                      key={modifier.modifier_id}
                      variant={isSelected ? "default" : "outline"}
                      className="justify-between h-auto p-3 text-left"
                      onClick={() => handleModifierSelect(modifier, groupType)}
                    >
                      <span className="flex-1">
                        {modifier.modifier_name}
                        {priceText && (
                          <span className="text-sm font-normal opacity-75">
                            {priceText}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check size={16} className="ml-2" />
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Selected Modifiers Summary */}
        {selectedModifiers.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Valgte tilvalg:</h4>
            <div className="space-y-1">
              {selectedModifiers.map((modifier, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{modifier.modifier_name}</span>
                  <span>
                    {modifier.price_adjustment === 0 
                      ? 'Gratis' 
                      : modifier.price_adjustment > 0
                        ? `+${modifier.price_adjustment.toFixed(0)} kr.`
                        : `${modifier.price_adjustment.toFixed(0)} kr.`
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Annuller
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart size={16} className="mr-2" />
            Tilføj til kurv - {totalPrice.toFixed(0)} kr.
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
