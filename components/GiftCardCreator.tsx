'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Gift, Mail, User, MessageSquare, Calendar, Loader2, Check } from 'lucide-react'
import { useCreateGiftCard, useGiftCardForm } from '@/hooks/useGiftCards'
import { formatCurrency, formatGiftCardCode } from '@/lib/giftCardUtils'

interface GiftCardCreatorProps {
  onGiftCardCreated?: (giftCard: any) => void
}

export default function GiftCardCreator({ onGiftCardCreated }: GiftCardCreatorProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdGiftCard, setCreatedGiftCard] = useState<any>(null)
  
  const { formData, errors, validateForm, updateField, resetForm } = useGiftCardForm()
  const createGiftCard = useCreateGiftCard()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const result = await createGiftCard.mutateAsync(formData)
      setCreatedGiftCard(result)
      setShowSuccess(true)
      onGiftCardCreated?.(result)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setCreatedGiftCard(null)
      }, 5000)
    } catch (error) {
      console.error('Error creating gift card:', error)
    }
  }

  const handleCreateAnother = () => {
    resetForm()
    setShowSuccess(false)
    setCreatedGiftCard(null)
  }

  if (showSuccess && createdGiftCard) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center bg-green-50">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Gavekort Oprettet!</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(createdGiftCard.initial_amount)}
            </div>
            <div className="text-lg font-mono tracking-wider">
              {formatGiftCardCode(createdGiftCard.gift_card_code)}
            </div>
            <div className="text-sm opacity-90 mt-2">
              Udløber: {new Date(createdGiftCard.expiry_date).toLocaleDateString('da-DK')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium">Gavekort ID</Label>
              <p className="text-muted-foreground">{createdGiftCard.gift_card_id}</p>
            </div>
            <div>
              <Label className="font-medium">Oprettet</Label>
              <p className="text-muted-foreground">{new Date().toLocaleString('da-DK')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleCreateAnother}
              className="flex-1"
            >
              <Gift className="w-4 h-4 mr-2" />
              Opret Endnu Et Gavekort
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setShowSuccess(false)
                setCreatedGiftCard(null)
              }}
            >
              Færdig
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Opret Gavekort
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Beløb *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="50"
                max="10000"
                step="1"
                value={formData.amount || ''}
                onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                placeholder="500"
                className={errors.amount ? 'border-red-500' : ''}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                DKK
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {[100, 250, 500, 750, 1000].map(amount => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('amount', amount)}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Modtager Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">Modtager Navn</Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name || ''}
                  onChange={(e) => updateField('recipient_name', e.target.value)}
                  placeholder="Fx. Anna Hansen"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient_email">Modtager Email</Label>
                <Input
                  id="recipient_email"
                  type="email"
                  value={formData.recipient_email || ''}
                  onChange={(e) => updateField('recipient_email', e.target.value)}
                  placeholder="anna@example.com"
                  className={errors.recipient_email ? 'border-red-500' : ''}
                />
                {errors.recipient_email && (
                  <p className="text-sm text-red-500">{errors.recipient_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Afsender Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_name">Afsender Navn</Label>
                <Input
                  id="sender_name"
                  value={formData.sender_name || ''}
                  onChange={(e) => updateField('sender_name', e.target.value)}
                  placeholder="Fx. Peter Nielsen"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sender_email">Afsender Email</Label>
                <Input
                  id="sender_email"
                  type="email"
                  value={formData.sender_email || ''}
                  onChange={(e) => updateField('sender_email', e.target.value)}
                  placeholder="peter@example.com"
                  className={errors.sender_email ? 'border-red-500' : ''}
                />
                {errors.sender_email && (
                  <p className="text-sm text-red-500">{errors.sender_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Personlig Besked
            </Label>
            <textarea
              id="message"
              value={formData.message || ''}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Skriv en personlig besked til modtageren..."
              className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {(formData.message || '').length}/500 tegn
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="expiry_months" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Udløber Efter (måneder)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="expiry_months"
                type="number"
                min="1"
                max="60"
                value={formData.expiry_months || ''}
                onChange={(e) => updateField('expiry_months', parseInt(e.target.value) || 12)}
                className={`w-24 ${errors.expiry_months ? 'border-red-500' : ''}`}
              />
              <div className="flex gap-2">
                {[6, 12, 24, 36].map(months => (
                  <Button
                    key={months}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField('expiry_months', months)}
                  >
                    {months} mdr
                  </Button>
                ))}
              </div>
            </div>
            {errors.expiry_months && (
              <p className="text-sm text-red-500">{errors.expiry_months}</p>
            )}
          </div>

          {/* Preview */}
          {formData.amount > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium mb-3">Forhåndsvisning</h3>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(formData.amount)}
                </div>
                <div className="text-sm opacity-90">
                  Gavekort fra {formData.sender_name || 'Payper Steak House'}
                </div>
                {formData.recipient_name && (
                  <div className="text-sm opacity-90 mt-1">
                    Til: {formData.recipient_name}
                  </div>
                )}
                <div className="text-xs opacity-75 mt-2">
                  Udløber: {new Date(Date.now() + (formData.expiry_months || 12) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('da-DK')}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createGiftCard.isPending || !formData.amount}
              className="flex-1"
            >
              {createGiftCard.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opretter Gavekort...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Opret Gavekort
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={createGiftCard.isPending}
            >
              Nulstil
            </Button>
          </div>

          {createGiftCard.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                Fejl ved oprettelse af gavekort: {createGiftCard.error.message}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
