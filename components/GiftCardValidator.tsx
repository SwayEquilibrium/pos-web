'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Gift, CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { useGiftCardBalance, useRedeemGiftCard } from '@/hooks/useGiftCards'
import { formatCurrency, formatGiftCardCode, validateGiftCardCode, cleanGiftCardCode } from '@/lib/giftCardUtils'

interface GiftCardValidatorProps {
  onRedemption?: (result: any) => void
  showRedemption?: boolean
}

export default function GiftCardValidator({ onRedemption, showRedemption = true }: GiftCardValidatorProps) {
  const [code, setCode] = useState('')
  const [redeemAmount, setRedeemAmount] = useState<number>(0)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const balanceQuery = useGiftCardBalance(code)
  const redeemMutation = useRedeemGiftCard()

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) return

    const cleanCode = cleanGiftCardCode(code)
    
    if (!validateGiftCardCode(cleanCode)) {
      setValidationResult({
        valid: false,
        message: 'Ugyldig gavekort kode format'
      })
      return
    }

    setIsValidating(true)
    setCode(cleanCode)
    
    try {
      const result = await balanceQuery.refetch()
      setIsValidating(false)
      
      if (result.data?.found) {
        setValidationResult({
          valid: true,
          giftCard: result.data,
          message: 'Gavekort valideret succesfuldt'
        })
      } else {
        setValidationResult({
          valid: false,
          message: 'Gavekort ikke fundet'
        })
      }
    } catch (error) {
      setIsValidating(false)
      setValidationResult({
        valid: false,
        message: 'Fejl ved validering af gavekort'
      })
    }
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!redeemAmount || redeemAmount <= 0) {
      return
    }

    if (!validationResult?.valid) {
      return
    }

    try {
      const result = await redeemMutation.mutateAsync({
        code,
        amount: redeemAmount
      })

      if (result.success) {
        // Update validation result with new balance
        setValidationResult(prev => ({
          ...prev,
          giftCard: {
            ...prev.giftCard,
            current_balance: result.remaining_balance
          }
        }))
        
        setRedeemAmount(0)
        onRedemption?.(result)
      }
    } catch (error) {
      console.error('Redemption error:', error)
    }
  }

  const handleClear = () => {
    setCode('')
    setRedeemAmount(0)
    setValidationResult(null)
    setIsValidating(false)
  }

  const formatCodeInput = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    const formatted = cleaned.replace(/(.{4})/g, '$1-').slice(0, 19)
    return formatted
  }

  const canRedeem = validationResult?.valid && 
                   validationResult?.giftCard?.status === 'active' && 
                   validationResult?.giftCard?.current_balance > 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Validation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Valider Gavekort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftCardCode">Gavekort Kode</Label>
              <div className="flex gap-3">
                <Input
                  id="giftCardCode"
                  value={code ? formatGiftCardCode(code) : formatCodeInput(code)}
                  onChange={(e) => setCode(cleanGiftCardCode(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="flex-1 font-mono text-lg tracking-wider"
                  maxLength={19}
                />
                <Button 
                  type="submit" 
                  disabled={isValidating || code.length < 16}
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Valider'
                  )}
                </Button>
                {validationResult && (
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
          </form>
        </CardContent>
      </Card>

      {/* Validation Result */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Validering Resultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.valid ? (
              <div className="space-y-4">
                {/* Gift Card Display */}
                <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(validationResult.giftCard.current_balance)}
                  </div>
                  <div className="text-lg font-mono tracking-wider">
                    {formatGiftCardCode(code)}
                  </div>
                  <div className="text-sm opacity-90 mt-2">
                    Tilgængelig saldo
                  </div>
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={validationResult.giftCard.status === 'active' ? 'default' : 'secondary'}
                        className={
                          validationResult.giftCard.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {validationResult.giftCard.status === 'active' ? '✅ Aktiv' : 
                         validationResult.giftCard.status === 'used' ? '✓ Brugt' :
                         validationResult.giftCard.status === 'expired' ? '⚠️ Udløbet' :
                         validationResult.giftCard.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Modtager</Label>
                    <p className="mt-1">{validationResult.giftCard.recipient_name || 'Ikke angivet'}</p>
                  </div>
                </div>

                {/* Warnings */}
                {validationResult.giftCard.status !== 'active' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      {validationResult.giftCard.status === 'used' && 'Dette gavekort er allerede brugt.'}
                      {validationResult.giftCard.status === 'expired' && 'Dette gavekort er udløbet.'}
                      {validationResult.giftCard.status === 'cancelled' && 'Dette gavekort er annulleret.'}
                    </div>
                  </div>
                )}

                {validationResult.giftCard.current_balance === 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-800">
                      Dette gavekort har ingen resterende saldo.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-800 font-medium">{validationResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Redemption Form */}
      {showRedemption && canRedeem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Indløs Gavekort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="redeemAmount">Beløb at Indløse</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="redeemAmount"
                      type="number"
                      min="1"
                      max={validationResult.giftCard.current_balance}
                      step="1"
                      value={redeemAmount || ''}
                      onChange={(e) => setRedeemAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      DKK
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRedeemAmount(validationResult.giftCard.current_balance)}
                  >
                    Max
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Maksimum: {formatCurrency(validationResult.giftCard.current_balance)}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={
                    redeemMutation.isPending || 
                    !redeemAmount || 
                    redeemAmount <= 0 || 
                    redeemAmount > validationResult.giftCard.current_balance
                  }
                  className="flex-1"
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Indløser...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Indløs {redeemAmount > 0 ? formatCurrency(redeemAmount) : ''}
                    </>
                  )}
                </Button>
              </div>

              {redeemMutation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    Fejl ved indløsning: {redeemMutation.error.message}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {redeemMutation.isSuccess && redeemMutation.data && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Gavekort Indløst!
            </h3>
            <p className="text-green-700 mb-3">
              {redeemMutation.data.message}
            </p>
            <p className="text-sm text-green-600">
              Resterende saldo: {formatCurrency(redeemMutation.data.remaining_balance)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
