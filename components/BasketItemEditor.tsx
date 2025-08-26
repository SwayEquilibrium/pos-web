'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Minus, Plus, X, Edit3 } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

export interface BasketItem {
  id: string
  product_id: string
  product_name: string
  qty: number
  unit_price: number
  original_price?: number
  modifiers?: Array<{
    modifier_id: string
    modifier_name: string
    price_adjustment: number
  }>
  kitchen_note?: string
  course_no: number
  discount_percentage?: number
  discount_amount?: number
}

interface BasketItemEditorProps {
  item: BasketItem
  onUpdate?: (updatedItem: BasketItem) => void
  onRemove?: (itemId: string) => void
  onSave?: (updatedItem: BasketItem) => void
  onDelete?: (itemId: string) => void
  onClose?: () => void
  isOpen?: boolean
  className?: string
}

export default function BasketItemEditor({ 
  item, 
  onUpdate, 
  onRemove, 
  onSave,
  onDelete,
  onClose,
  isOpen,
  className = '' 
}: BasketItemEditorProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editingInstructions, setEditingInstructions] = useState(item.kitchen_note || '')
  const [discountPercentage, setDiscountPercentage] = useState(item.discount_percentage || 0)
  const [discountAmount, setDiscountAmount] = useState(item.discount_amount || 0)

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity <= 0) {
      (onRemove || onDelete)?.(item.id)
      return
    }

    const updatedItem = {
      ...item,
      qty: newQuantity,
      unit_price: calculateUnitPrice(item.original_price || item.unit_price, item.modifiers || [], discountPercentage, discountAmount)
    }
    ;(onUpdate || onSave)?.(updatedItem)
  }

  const updateInstructions = () => {
    const updatedItem = {
      ...item,
      kitchen_note: editingInstructions.trim() || undefined
    }
    ;(onUpdate || onSave)?.(updatedItem)
    setIsEditing(false)
  }

  const updateDiscount = () => {
    const updatedItem = {
      ...item,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      unit_price: calculateUnitPrice(item.original_price || item.unit_price, item.modifiers || [], discountPercentage, discountAmount)
    }
    ;(onUpdate || onSave)?.(updatedItem)
  }

  const calculateUnitPrice = (basePrice: number, modifiers: Array<{price_adjustment: number}>, discountPct: number, discountAmt: number) => {
    const modifierTotal = modifiers.reduce((sum, mod) => sum + mod.price_adjustment, 0)
    let price = basePrice + modifierTotal
    
    // Apply percentage discount first
    if (discountPct > 0) {
      price = price * (1 - discountPct / 100)
    }
    
    // Then apply fixed discount
    if (discountAmt > 0) {
      price = Math.max(0, price - discountAmt)
    }
    
    return price
  }

  const itemTotal = item.unit_price * item.qty

  const cardContent = (
    <Card className={`${className} border-l-4 border-l-blue-500`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.product_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {(item.original_price || item.unit_price).toFixed(2)} kr
              </Badge>
              {item.modifiers && item.modifiers.length > 0 && (
                <Badge variant="outline">
                  +{item.modifiers.length} {t('language') === 'da' ? 'tilvalg' : 'options'}
                </Badge>
              )}
              {(discountPercentage > 0 || discountAmount > 0) && (
                <Badge variant="destructive">
                  {discountPercentage > 0 && `-${discountPercentage}%`}
                  {discountAmount > 0 && `-${discountAmount} kr`}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (onRemove || onDelete)?.(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Modifiers */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">
              {t('language') === 'da' ? 'Tilvalg:' : 'Options:'}
            </Label>
            <div className="space-y-1">
              {item.modifiers.map((modifier, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>+ {modifier.modifier_name}</span>
                  <span>{modifier.price_adjustment >= 0 ? '+' : ''}{modifier.price_adjustment.toFixed(2)} kr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-600">
              {t('language') === 'da' ? 'Særlige ønsker:' : 'Special instructions:'}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Edit3 size={12} />
            </Button>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editingInstructions}
                onChange={(e) => setEditingInstructions(e.target.value)}
                placeholder={t('language') === 'da' ? 'Tilføj særlige ønsker...' : 'Add special instructions...'}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={updateInstructions}>
                  {t('save')}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setEditingInstructions(item.kitchen_note || '')
                    setIsEditing(false)
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">
              {item.kitchen_note || (t('language') === 'da' ? 'Ingen særlige ønsker' : 'No special instructions')}
            </p>
          )}
        </div>

        {/* Discount Controls */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium text-gray-700">
            {t('language') === 'da' ? 'Rabat:' : 'Discount:'}
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">
                {t('language') === 'da' ? 'Procent (%)' : 'Percentage (%)'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                  onBlur={updateDiscount}
                  min="0"
                  max="100"
                  step="0.1"
                  className="text-sm"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">
                {t('language') === 'da' ? 'Fast beløb (kr)' : 'Fixed amount (kr)'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  onBlur={updateDiscount}
                  min="0"
                  step="0.01"
                  className="text-sm"
                />
                <span className="text-xs text-gray-500">kr</span>
              </div>
            </div>
          </div>
          
          {(discountPercentage > 0 || discountAmount > 0) && (
            <div className="text-xs text-green-600 font-medium">
              {t('language') === 'da' ? 'Rabat anvendt:' : 'Discount applied:'} 
              {discountPercentage > 0 && ` ${discountPercentage}%`}
              {discountAmount > 0 && ` ${discountAmount} kr`}
            </div>
          )}
        </div>

        {/* Quantity and Price */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">
              {t('language') === 'da' ? 'Antal:' : 'Quantity:'}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.qty - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus size={14} />
              </Button>
              <span className="w-8 text-center font-medium">{item.qty}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.qty + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">
              {itemTotal.toFixed(2)} kr
            </div>
            {item.qty > 1 && (
              <div className="text-sm text-gray-500">
                {item.qty} × {(itemTotal / item.qty).toFixed(2)} kr
              </div>
            )}
            
            {/* Edit Modifiers Button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                // This will trigger the modifier selector for editing
                // For now, show a placeholder
                alert('Modifier editing will open the ModifierSelector component')
              }}
            >
              <Edit3 size={14} className="mr-1" />
              {t('language') === 'da' ? 'Rediger tilvalg' : 'Edit Modifiers'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // If used as modal, wrap in Dialog
  if (isOpen && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('language') === 'da' ? 'Rediger produkt' : 'Edit Item'}
            </DialogTitle>
          </DialogHeader>
          {cardContent}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              {t('language') === 'da' ? 'Luk' : 'Close'}
            </Button>
            {onDelete && (
              <Button 
                onClick={() => {
                  onDelete(item.id)
                  onClose()
                }} 
                variant="destructive"
                className="flex-1"
              >
                {t('language') === 'da' ? 'Slet' : 'Delete'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Otherwise return inline card
  return cardContent
}
