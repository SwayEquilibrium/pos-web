'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// Using custom collapsible implementation since ui/collapsible doesn't exist
import { ChevronDown, ChevronRight, Plus, Minus, Check, X, ShoppingCart } from 'lucide-react'
import { useProductModifiers, groupModifiersByGroup, type ProductModifier, type SelectedModifier } from '@/hooks/useModifiers'
import { useTranslation } from '@/contexts/LanguageContext'
import { BasketItem } from '@/components/BasketItemEditor'

interface BasketItemModifierEditorProps {
  item: BasketItem
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: BasketItem) => void
}

export default function BasketItemModifierEditor({
  item,
  isOpen,
  onClose,
  onSave
}: BasketItemModifierEditorProps) {
  const { t } = useTranslation()
  const { data: productModifiers, isLoading } = useProductModifiers(item.product_id)
  
  // State for currently selected modifiers (initialize with existing modifiers)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(
    item.modifiers?.map(mod => ({
      modifier_id: mod.modifier_id,
      modifier_name: mod.modifier_name,
      price_adjustment: mod.price_adjustment
    })) || []
  )
  
  // State for which modifier groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  // Group modifiers by their groups
  const modifierGroups = useMemo(() => {
    return productModifiers ? groupModifiersByGroup(productModifiers) : {}
  }, [productModifiers])
  
  const groupIds = Object.keys(modifierGroups)

  // Calculate total price including modifiers
  const totalPrice = useMemo(() => {
    const basePrice = item.original_price || item.unit_price
    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price_adjustment, 0)
    return (basePrice + modifierTotal) * item.qty
  }, [item.original_price, item.unit_price, item.qty, selectedModifiers])

  // Reset selection when item changes
  useEffect(() => {
    setSelectedModifiers(
      item.modifiers?.map(mod => ({
        modifier_id: mod.modifier_id,
        modifier_name: mod.modifier_name,
        price_adjustment: mod.price_adjustment
      })) || []
    )
  }, [item.id])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const handleModifierToggle = (modifier: ProductModifier, groupType: 'variant' | 'addon') => {
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

  const getGroupStats = (groupId: string) => {
    const group = modifierGroups[groupId]
    if (!group || group.length === 0) return { selected: 0, total: 0, type: 'addon' }
    
    const selectedInGroup = selectedModifiers.filter(sm => 
      group.some(gm => gm.modifier_id === sm.modifier_id)
    ).length
    
    return {
      selected: selectedInGroup,
      total: group.length,
      type: group[0].group_type as 'variant' | 'addon'
    }
  }

  const handleSave = () => {
    const updatedItem: BasketItem = {
      ...item,
      modifiers: selectedModifiers.map(mod => ({
        modifier_id: mod.modifier_id,
        modifier_name: mod.modifier_name,
        price_adjustment: mod.price_adjustment
      })),
      unit_price: totalPrice / item.qty // Update unit price to include modifiers
    }
    
    onSave(updatedItem)
    onClose()
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('language') === 'da' ? 'Indlæser tilvalg...' : 'Loading modifiers...'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">
                {t('language') === 'da' ? 'Indlæser...' : 'Loading...'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart size={20} />
            {t('language') === 'da' ? 'Rediger tilvalg' : 'Edit Modifiers'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{item.product_name}</p>
            <p>{t('language') === 'da' ? 'Antal: ' : 'Quantity: '}{item.qty}</p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {groupIds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('language') === 'da' ? 'Ingen tilvalg tilgængelige for dette produkt' : 'No modifiers available for this product'}</p>
            </div>
          ) : (
            groupIds.map(groupId => {
              const group = modifierGroups[groupId]
              if (!group || group.length === 0) return null
              
              const firstModifier = group[0]
              const stats = getGroupStats(groupId)
              const isExpanded = expandedGroups.has(groupId)
              
              return (
                <Card key={groupId} className="border-l-4 border-l-blue-500">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <div>
                          <CardTitle className="text-base">
                            {firstModifier.group_name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={stats.type === 'variant' ? 'default' : 'secondary'}>
                              {stats.type === 'variant' 
                                ? (t('language') === 'da' ? 'Variant' : 'Variant')
                                : (t('language') === 'da' ? 'Tilvalg' : 'Addon')
                              }
                            </Badge>
                            {firstModifier.group_required && (
                              <Badge variant="destructive" className="text-xs">
                                {t('language') === 'da' ? 'Påkrævet' : 'Required'}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {stats.selected} / {stats.total} {t('language') === 'da' ? 'valgt' : 'selected'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {stats.selected > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Check size={12} className="mr-1" />
                            {stats.selected}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0 space-y-2">
                      {group.map(modifier => {
                        const isSelected = isModifierSelected(modifier.modifier_id)
                        
                        return (
                          <div
                            key={modifier.modifier_id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                                : 'hover:bg-muted/50 border-border'
                            }`}
                            onClick={() => handleModifierToggle(modifier, stats.type)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{modifier.modifier_name}</p>
                                {modifier.modifier_description && (
                                  <p className="text-xs text-muted-foreground">
                                    {modifier.modifier_description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                modifier.modifier_price > 0 ? 'text-green-600' : 
                                modifier.modifier_price < 0 ? 'text-red-600' : 
                                'text-muted-foreground'
                              }`}>
                                {modifier.modifier_price > 0 ? '+' : ''}{modifier.modifier_price.toFixed(2)} kr
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Summary and Actions */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('language') === 'da' ? 'Samlet pris:' : 'Total price:'}
              </p>
              <p className="text-lg font-bold">{totalPrice.toFixed(2)} kr</p>
              {selectedModifiers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('language') === 'da' ? 'Inkl. ' : 'Incl. '}{selectedModifiers.length} {t('language') === 'da' ? 'tilvalg' : 'modifiers'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X size={16} className="mr-2" />
                {t('language') === 'da' ? 'Annuller' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Check size={16} className="mr-2" />
                {t('language') === 'da' ? 'Gem ændringer' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
