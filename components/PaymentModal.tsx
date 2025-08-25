'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  Users, 
  X, 
  Check,
  Calculator,
  Percent
} from 'lucide-react'
import { useCustomerGroups } from '@/hooks/useCustomerGroups'
import { useGiftCardBalance } from '@/hooks/useGiftCards'
import { formatCurrency, cleanGiftCardCode, validateGiftCardCode } from '@/lib/giftCardUtils'

export interface PaymentDetails {
  method: string
  amount: number
  reference?: string
  cashReceived?: number
  changeGiven?: number
  customerGroup?: {
    id: string
    display_name: string
    discount_percentage: number
  }
  discountAmount?: number
  giftCardCode?: string
  giftCardAmount?: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  onPaymentComplete: (paymentDetails: PaymentDetails) => void
}

type PaymentMethod = 'cash' | 'card' | 'mobilepay' | 'giftcard' | 'multiple'

export default function PaymentModal({ isOpen, onClose, totalAmount, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState<number>(totalAmount)
  const [giftCardCode, setGiftCardCode] = useState('')
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: customerGroups } = useCustomerGroups()
  const giftCardBalance = useGiftCardBalance(giftCardCode)

  // Calculate discount and final amount
  const selectedGroup = customerGroups?.find(group => group.id === selectedCustomerGroup)
  const discountPercentage = selectedGroup?.discount_percentage || 0
  const discountAmount = (totalAmount * discountPercentage) / 100
  const finalAmount = totalAmount - discountAmount

  // Calculate change for cash payments
  const changeGiven = selectedMethod === 'cash' ? Math.max(0, cashReceived - finalAmount) : 0

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: 'Kontant',
      icon: <Banknote className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Betaling med kontanter'
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Kort',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Dankort, Visa, Mastercard'
    },
    {
      id: 'mobilepay' as PaymentMethod,
      name: 'MobilePay',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'MobilePay betaling'
    },
    {
      id: 'giftcard' as PaymentMethod,
      name: 'Gavekort',
      icon: <Gift className="w-5 h-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      description: 'Betaling med gavekort'
    }
  ]

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashReceived(totalAmount)
      setGiftCardCode('')
      setSelectedCustomerGroup('')
      setSelectedMethod('cash')
    }
  }, [isOpen, totalAmount])

  const handlePaymentComplete = async () => {
    setIsProcessing(true)

    try {
      let paymentDetails: PaymentDetails = {
        method: paymentMethods.find(m => m.id === selectedMethod)?.name || selectedMethod,
        amount: finalAmount
      }

      // Add method-specific details
      if (selectedMethod === 'cash') {
        paymentDetails.cashReceived = cashReceived
        paymentDetails.changeGiven = changeGiven
        paymentDetails.reference = `CASH-${Date.now()}`
      } else if (selectedMethod === 'card') {
        paymentDetails.reference = `CARD-${Date.now()}`
      } else if (selectedMethod === 'mobilepay') {
        paymentDetails.reference = `MP-${Date.now()}`
      } else if (selectedMethod === 'giftcard') {
        paymentDetails.giftCardCode = giftCardCode
        paymentDetails.giftCardAmount = finalAmount
        paymentDetails.reference = `GC-${giftCardCode}`
      }

      // Add customer group details
      if (selectedGroup) {
        paymentDetails.customerGroup = selectedGroup
        paymentDetails.discountAmount = discountAmount
      }

      await onPaymentComplete(paymentDetails)
      onClose()
    } catch (error) {
      console.error('Payment processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isGiftCardValid = selectedMethod === 'giftcard' && 
                         validateGiftCardCode(giftCardCode) && 
                         giftCardBalance.data?.found &&
                         giftCardBalance.data?.current_balance >= finalAmount

  const canProcessPayment = () => {
    if (selectedMethod === 'cash') {
      return cashReceived >= finalAmount
    }
    if (selectedMethod === 'giftcard') {
      return isGiftCardValid
    }
    return true // Card and MobilePay are always valid
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Betaling</h2>
            <p className="text-muted-foreground">Vælg betalingsmetode</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Total at betale:</span>
                  <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Rabat ({discountPercentage}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                      <span>At betale:</span>
                      <span>{formatCurrency(finalAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Groups */}
          {customerGroups && customerGroups.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Kundegruppe
              </Label>
              <Select value={selectedCustomerGroup} onValueChange={setSelectedCustomerGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg kundegruppe (valgfrit)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ingen kundegruppe</SelectItem>
                  {customerGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.display_name}</span>
                        {group.discount_percentage > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {group.discount_percentage}% rabat
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label>Vælg betalingsmetode:</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full text-white ${method.color}`}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-muted-foreground">{method.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Payment Details */}
          {selectedMethod === 'cash' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Kontant Betaling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modtaget beløb</Label>
                  <Input
                    type="number"
                    min={finalAmount}
                    step="1"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                  />
                </div>
                
                {changeGiven > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">Byttepenge: {formatCurrency(changeGiven)}</span>
                    </div>
                  </div>
                )}

                {cashReceived < finalAmount && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-800 text-sm">
                      Modtaget beløb er ikke tilstrækkeligt. Mangler: {formatCurrency(finalAmount - cashReceived)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gift Card Payment Details */}
          {selectedMethod === 'giftcard' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Gavekort betaling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Gavekort kode:</Label>
                  <Input
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(cleanGiftCardCode(e.target.value))}
                    placeholder="Indtast gavekort kode"
                    className="font-mono"
                  />
                </div>

                {giftCardCode && validateGiftCardCode(giftCardCode) && (
                  <div className="space-y-2">
                    {giftCardBalance.isLoading && (
                      <div className="text-sm text-muted-foreground">Validerer gavekort...</div>
                    )}
                    
                    {giftCardBalance.data && (
                      <div className={`border rounded-lg p-3 ${
                        giftCardBalance.data.found ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        {giftCardBalance.data.found ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-green-800">
                              <Check className="w-4 h-4" />
                              <span className="font-medium">Gavekort fundet</span>
                            </div>
                            <div className="text-sm text-green-700">
                              Saldo: {formatCurrency(giftCardBalance.data.current_balance)}
                            </div>
                            {giftCardBalance.data.current_balance < finalAmount && (
                              <div className="text-sm text-red-600">
                                Utilstrækkelig saldo. Mangler: {formatCurrency(finalAmount - giftCardBalance.data.current_balance)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-800 text-sm">
                            Gavekort ikke fundet eller ugyldigt
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuller
            </Button>
            <Button
              onClick={handlePaymentComplete}
              disabled={!canProcessPayment() || isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                'Behandler...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Gennemfør betaling
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
