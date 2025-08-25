'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Gift, Calendar, User, Mail, MessageSquare, Loader2, CreditCard } from 'lucide-react'
import { useGiftCardLookup, useGiftCardTransactions } from '@/hooks/useGiftCards'
import { formatCurrency, formatGiftCardCode, formatDate, getGiftCardStatusInfo } from '@/lib/giftCardUtils'

export default function GiftCardLookup() {
  const [inputCode, setInputCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  
  const { 
    code, 
    isValidating, 
    validateCode, 
    clearCode, 
    giftCard, 
    balance 
  } = useGiftCardLookup()

  const transactionsQuery = useGiftCardTransactions(giftCard?.id || '')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputCode.trim()) return

    const result = await validateCode(inputCode.trim())
    setValidationResult(result)
  }

  const handleClear = () => {
    setInputCode('')
    setValidationResult(null)
    clearCode()
  }

  const formatCodeInput = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Add dashes every 4 characters
    const formatted = cleaned.replace(/(.{4})/g, '$1-').slice(0, 19) // Max 16 chars + 3 dashes
    
    return formatted
  }

  const statusInfo = giftCard ? getGiftCardStatusInfo(giftCard.status, giftCard.expiry_date) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Slå Gavekort Op
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftCardCode">Gavekort Kode</Label>
              <div className="flex gap-3">
                <Input
                  id="giftCardCode"
                  value={inputCode}
                  onChange={(e) => setInputCode(formatCodeInput(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="flex-1 font-mono text-lg tracking-wider"
                  maxLength={19}
                />
                <Button 
                  type="submit" 
                  disabled={isValidating || inputCode.length < 16}
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
                {(validationResult || giftCard) && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleClear}
                  >
                    Ryd
                  </Button>
                )}
              </div>
            </div>

            {validationResult && !validationResult.valid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{validationResult.message}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Gift Card Details */}
      {giftCard && balance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gift Card Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Gavekort Detaljer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gift Card Visual */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(giftCard.current_balance)}
                </div>
                <div className="text-lg font-mono tracking-wider">
                  {formatGiftCardCode(giftCard.code)}
                </div>
                <div className="text-sm opacity-90 mt-2">
                  Saldo af {formatCurrency(giftCard.initial_amount)}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <Badge className={statusInfo?.color}>
                  {statusInfo?.icon} {statusInfo?.label}
                </Badge>
              </div>

              {/* Key Information */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Oprindeligt Beløb</Label>
                  <span className="font-medium">{formatCurrency(giftCard.initial_amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <Label>Nuværende Saldo</Label>
                  <span className="font-medium text-green-600">
                    {formatCurrency(giftCard.current_balance)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <Label>Brugt Beløb</Label>
                  <span className="font-medium">
                    {formatCurrency(giftCard.initial_amount - giftCard.current_balance)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <Label>Udstedt</Label>
                  <span>{formatDate(giftCard.issued_date)}</span>
                </div>

                {giftCard.expiry_date && (
                  <div className="flex justify-between">
                    <Label>Udløber</Label>
                    <span>{formatDate(giftCard.expiry_date)}</span>
                  </div>
                )}

                {giftCard.used_date && (
                  <div className="flex justify-between">
                    <Label>Brugt</Label>
                    <span>{formatDate(giftCard.used_date)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recipient & Sender Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personer & Besked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient */}
              {(giftCard.recipient_name || giftCard.recipient_email) && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Modtager
                  </Label>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    {giftCard.recipient_name && (
                      <p className="font-medium">{giftCard.recipient_name}</p>
                    )}
                    {giftCard.recipient_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {giftCard.recipient_email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sender */}
              {(giftCard.sender_name || giftCard.sender_email) && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Afsender
                  </Label>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    {giftCard.sender_name && (
                      <p className="font-medium">{giftCard.sender_name}</p>
                    )}
                    {giftCard.sender_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {giftCard.sender_email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              {giftCard.message && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Besked
                  </Label>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm italic">"{giftCard.message}"</p>
                  </div>
                </div>
              )}

              {/* No additional info */}
              {!giftCard.recipient_name && !giftCard.recipient_email && 
               !giftCard.sender_name && !giftCard.sender_email && !giftCard.message && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen yderligere information tilgængelig</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History */}
      {giftCard && transactionsQuery.data && transactionsQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Transaktionshistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionsQuery.data.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.transaction_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.transaction_type === 'redeem' ? 'text-red-600' : 
                      transaction.transaction_type === 'issue' ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {transaction.transaction_type === 'redeem' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Saldo: {formatCurrency(transaction.balance_after)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
