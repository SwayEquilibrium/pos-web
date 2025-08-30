'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Gift, Plus, CreditCard, DollarSign, Search, Eye } from 'lucide-react'
import { useGiftCards, useCreateGiftCard, useRedeemGiftCard } from '@/hooks/useGiftCards'
import { toast } from 'sonner'

export default function GiftCardsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showRedeemForm, setShowRedeemForm] = useState(false)
  const [selectedGiftCard, setSelectedGiftCard] = useState<any>(null)
  const [searchCode, setSearchCode] = useState('')
  const [newGiftCard, setNewGiftCard] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: ''
  })
  const [redeemAmount, setRedeemAmount] = useState('')

  // Gift cards data
  const { data: giftCards = [], isLoading } = useGiftCards()
  const createGiftCard = useCreateGiftCard()
  const redeemGiftCard = useRedeemGiftCard()

  const filteredGiftCards = giftCards.filter(card =>
    card.code?.toLowerCase().includes(searchCode.toLowerCase())
  )

  const handleCreateGiftCard = async () => {
    if (!newGiftCard.amount || !newGiftCard.recipientName) {
      toast.error('Please fill in amount and recipient name')
      return
    }

    try {
      await createGiftCard.mutateAsync({
        amount: parseFloat(newGiftCard.amount),
        recipientName: newGiftCard.recipientName,
        recipientEmail: newGiftCard.recipientEmail || undefined
      })
      toast.success('Gift card created successfully!')
      setShowCreateForm(false)
      setNewGiftCard({ amount: '', recipientName: '', recipientEmail: '' })
    } catch (error) {
      toast.error('Failed to create gift card')
    }
  }

  const handleRedeemGiftCard = async (giftCardId: string) => {
    if (!redeemAmount) {
      toast.error('Please enter redemption amount')
      return
    }

    try {
      await redeemGiftCard.mutateAsync({
        gift_card_id: giftCardId,
        amount: parseFloat(redeemAmount)
      })
      toast.success('Gift card redeemed successfully!')
      setShowRedeemForm(false)
      setSelectedGiftCard(null)
      setRedeemAmount('')
    } catch (error) {
      toast.error('Failed to redeem gift card')
    }
  }

  const totalValue = giftCards.reduce((sum, card) => sum + (card.balance || 0), 0)
  const activeCards = giftCards.filter(card => (card.balance || 0) > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-600 mt-2">Manage gift card programs and balance tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRedeemForm(true)}>
            <CreditCard className="w-4 h-4 mr-2" />
            Redeem Card
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Gift Card
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Active Gift Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards}</div>
            <div className="text-xs text-gray-600 mt-1">With remaining balance</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalValue.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">Remaining balance</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giftCards.length}</div>
            <div className="text-xs text-gray-600 mt-1">All time</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search by code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Enter gift card code..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading gift cards...</div>
          ) : (
            <div className="space-y-3">
              {filteredGiftCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium">{card.code}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Balance: €{card.balance?.toFixed(2) || '0.00'}</span>
                        {card.expires_at && (
                          <span>• Expires: {new Date(card.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={(card.balance || 0) > 0 ? 'default' : 'secondary'}>
                      {(card.balance || 0) > 0 ? 'Active' : 'Used'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGiftCard(card)
                        setShowRedeemForm(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}

              {filteredGiftCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchCode ? 'No gift cards found matching your search' : 'No gift cards yet'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Gift Card Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Gift Card</DialogTitle>
            <DialogDescription>
              Issue a new gift card for a customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="50.00"
                value={newGiftCard.amount}
                onChange={(e) => setNewGiftCard({ ...newGiftCard, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="John Doe"
                value={newGiftCard.recipientName}
                onChange={(e) => setNewGiftCard({ ...newGiftCard, recipientName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="john@example.com"
                value={newGiftCard.recipientEmail}
                onChange={(e) => setNewGiftCard({ ...newGiftCard, recipientEmail: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGiftCard} disabled={createGiftCard.isPending}>
              {createGiftCard.isPending ? 'Creating...' : 'Create Gift Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Gift Card Dialog */}
      <Dialog open={showRedeemForm} onOpenChange={setShowRedeemForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Gift Card</DialogTitle>
            <DialogDescription>
              Use gift card balance for payment
            </DialogDescription>
          </DialogHeader>

          {selectedGiftCard && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedGiftCard.code}</p>
                <p className="text-sm text-gray-600">
                  Current Balance: €{selectedGiftCard.balance?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div>
                <Label htmlFor="redeemAmount">Redemption Amount (€)</Label>
                <Input
                  id="redeemAmount"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedeemForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedGiftCard && handleRedeemGiftCard(selectedGiftCard.id)}
              disabled={redeemGiftCard.isPending}
            >
              {redeemGiftCard.isPending ? 'Redeeming...' : 'Redeem Gift Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}