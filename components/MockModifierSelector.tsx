'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useMockProductModifiers, groupModifiersByGroup, calculateItemPrice, type SelectedModifier } from '@/hooks/useMockModifiers'
import { ShoppingCart, X, Check, AlertCircle } from 'lucide-react'
import { type Product } from '@/lib/menuData'

interface MockModifierSelectorProps {
  product: Product
  onConfirm: (modifiers: SelectedModifier[], totalPrice: number) => void
  onCancel: () => void
}

export default function MockModifierSelector({ 
  product, 
  onConfirm, 
  onCancel 
}: MockModifierSelectorProps) {
  const { data: productModifiers, isLoading } = useMockProductModifiers(product.id)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [errors, setErrors] = useState<string[]>([])

  // Debug logging
  useEffect(() => {
    console.log(`[MockModifierSelector] Product: ${product.name} (${product.id})`)
    console.log(`[MockModifierSelector] Loading: ${isLoading}`)
    console.log(`[MockModifierSelector] Product Modifiers:`, productModifiers)
  }, [product, productModifiers, isLoading])

  // Group modifiers by their groups
  const modifierGroups = productModifiers ? groupModifiersByGroup(productModifiers) : {}
  const groupIds = Object.keys(modifierGroups)
  
  console.log(`[MockModifierSelector] Modifier Groups:`, modifierGroups)
  console.log(`[MockModifierSelector] Group IDs:`, groupIds)

  // Calculate total price
  const totalPrice = calculateItemPrice(product.price, selectedModifiers)

  // Reset selection when product changes
  useEffect(() => {
    setSelectedModifiers([])
    setErrors([])
  }, [product.id])

  const handleModifierSelect = (modifier: any, groupType: 'variant' | 'addon') => {
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
      if (group.length > 0 && group[0].group_required) {
        const hasSelection = selectedModifiers.some(m => 
          group.some(gm => gm.modifier_id === m.modifier_id)
        )
        if (!hasSelection) {
          newErrors.push(`Du skal vælge en option fra "${group[0].group_name}"`)
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

  // If no modifiers, auto-confirm
  useEffect(() => {
    if (!isLoading && productModifiers && productModifiers.length === 0) {
      console.log('[MockModifierSelector] No modifiers found, auto-confirming')
      onConfirm([], product.price)
    }
  }, [isLoading, productModifiers, onConfirm, product.price])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Indlæser tilvalg...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no modifiers available, this should auto-confirm (handled in useEffect above)
  if (!productModifiers || productModifiers.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {product.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tilpas dit valg
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Manglende valg</span>
              </div>
              <ul className="mt-2 text-sm text-red-700">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {groupIds.map(groupId => {
              const group = modifierGroups[groupId]
              const firstItem = group[0]
              const isRequired = firstItem.group_required
              const isVariant = firstItem.group_type === 'variant'

              return (
                <div key={groupId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {firstItem.group_name}
                    </Label>
                    {isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Påkrævet
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {isVariant ? 'Vælg én' : 'Vælg flere'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.map(modifier => {
                      const isSelected = isModifierSelected(modifier.modifier_id)
                      const priceText = modifier.modifier_price === 0 
                        ? 'Gratis' 
                        : `${modifier.modifier_price > 0 ? '+' : ''}${modifier.modifier_price} kr`

                      return (
                        <Button
                          key={modifier.modifier_id}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-auto p-4 justify-between ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleModifierSelect(modifier, firstItem.group_type)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-primary-foreground bg-primary-foreground' 
                                : 'border-current'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary" />}
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{modifier.modifier_name}</div>
                              <div className={`text-sm ${
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {priceText}
                              </div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>

        <div className="border-t p-6 bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-lg">Total: {totalPrice.toFixed(2)} kr</p>
              <p className="text-sm text-muted-foreground">
                Basispris: {product.price.toFixed(2)} kr
                {selectedModifiers.length > 0 && (
                  <span> + tilvalg: {(totalPrice - product.price).toFixed(2)} kr</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Annuller
              </Button>
              <Button onClick={handleConfirm} className="min-w-[120px]">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Tilføj til kurv
              </Button>
            </div>
          </div>

          {selectedModifiers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Valgte tilvalg:</p>
              <div className="flex flex-wrap gap-1">
                {selectedModifiers.map((mod, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {mod.modifier_name}
                    {mod.price_adjustment !== 0 && (
                      <span className="ml-1">
                        ({mod.price_adjustment > 0 ? '+' : ''}{mod.price_adjustment} kr)
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
