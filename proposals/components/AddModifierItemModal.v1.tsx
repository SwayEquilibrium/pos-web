'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, DollarSign } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

interface AddModifierItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; price_adjustment: number; description?: string }) => void
  groupName: string
  isLoading?: boolean
}

export default function AddModifierItemModal({
  isOpen,
  onClose,
  onSubmit,
  groupName,
  isLoading = false
}: AddModifierItemModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    price_adjustment: 0,
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    onSubmit({
      name: formData.name.trim(),
      price_adjustment: formData.price_adjustment,
      description: formData.description.trim() || undefined
    })
    
    // Reset form
    setFormData({
      name: '',
      price_adjustment: 0,
      description: ''
    })
  }

  const handleClose = () => {
    setFormData({
      name: '',
      price_adjustment: 0,
      description: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              {t('language') === 'da' ? 'Tilføj Item' : 'Add Item'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {t('language') === 'da' ? 'Til gruppen: ' : 'To group: '}
            <span className="font-medium">{groupName}</span>
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">
                {t('language') === 'da' ? 'Navn *' : 'Name *'}
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('language') === 'da' ? 'F.eks. Extra Ost, Stor, Ketchup' : 'e.g. Extra Cheese, Large, Ketchup'}
                required
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t('language') === 'da' ? 'Pris Justering (kr)' : 'Price Adjustment (kr)'}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_adjustment}
                onChange={(e) => setFormData(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('language') === 'da' 
                  ? 'Positiv for ekstra omkostning, negativ for rabat, 0 for gratis'
                  : 'Positive for extra cost, negative for discount, 0 for free'
                }
              </p>
            </div>

            <div>
              <Label htmlFor="description">
                {t('language') === 'da' ? 'Beskrivelse (valgfri)' : 'Description (optional)'}
              </Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('language') === 'da' ? 'Ekstra information om dette item' : 'Additional information about this item'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!formData.name.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {t('language') === 'da' ? 'Tilføj Item' : 'Add Item'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('language') === 'da' ? 'Annuller' : 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
