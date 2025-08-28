'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  Building,
  Users,
  X
} from 'lucide-react'
import { usePaymentTypes, useCreatePayment } from '@/hooks/useOrders'
import { useCustomerGroups, useRecordCustomerGroupPurchase } from '@/hooks/useCustomerGroups'
import { validateGiftCard } from '@/hooks/useGiftCards'

export interface PaymentDetails {
  payment_id: string
  method: string
  amount: number
  reference?: string
  change?: number
  customer_group_id?: string
  gift_card_balance?: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  totalAmount: number
  onPaymentComplete: (payment: PaymentDetails) => void
  customerName?: string
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onPaymentComplete,
  customerName
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('GIFT_CARD')
  const [cashReceived, setCashReceived] = useState<string>('')
  const [giftCardCode, setGiftCardCode] = useState<string>('GC-2024-ABCD1234-EFGH5678')
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null)
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false)

  // Data fetching
  const { data: paymentTypes, isLoading: loadingPaymentTypes } = usePaymentTypes()
  const { data: customerGroups } = useCustomerGroups()
  const { mutate: recordPayment, isPending: isRecording, error } = useCreatePayment()
  const recordCustomerGroupPurchase = useRecordCustomerGroupPurchase()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('GIFT_CARD')
      setCashReceived('')
      setGiftCardCode('GC-2024-ABCD1234-EFGH5678')
      setSelectedCustomerGroup('')
      setGiftCardBalance(null)
    }
  }, [isOpen])

  // Auto-fill cash amount when CASH method is selected
  useEffect(() => {
    if (selectedMethod === 'CASH') {
      const discountedAmount = totalAmount - (selectedCustomerGroup ? (totalAmount * (customerGroups?.find(g => g.id === selectedCustomerGroup)?.discount_percentage || 0)) / 100 : 0)
      setCashReceived(discountedAmount.toFixed(2))
    }
  }, [selectedMethod, totalAmount, selectedCustomerGroup, customerGroups])

  const selectedPaymentType = paymentTypes?.find(pt => pt.code === selectedMethod)
  const cashAmount = parseFloat(cashReceived) || 0
  const change = selectedMethod === 'CASH' ? Math.max(0, cashAmount - totalAmount) : 0
  const selectedGroup = customerGroups?.find(g => g.id === selectedCustomerGroup)
  const discountAmount = selectedGroup ? (totalAmount * (selectedGroup.discount_percentage || 0)) / 100 : 0
  const finalAmount = Math.max(0.01, totalAmount - discountAmount) // Ensure minimum 0.01 kr

  // Validate gift card when code changes
  useEffect(() => {
    if (selectedMethod === 'GIFT_CARD' && giftCardCode.trim()) {
      const validateCard = async () => {
        setIsValidatingGiftCard(true)
        try {
          const result = await validateGiftCard.mutateAsync(giftCardCode.trim())
          setGiftCardBalance(result.balance)
        } catch (error) {
          setGiftCardBalance(null)
        } finally {
          setIsValidatingGiftCard(false)
        }
      }
      
      const timeoutId = setTimeout(validateCard, 500) // Debounce validation
      return () => clearTimeout(timeoutId)
    }
  }, [giftCardCode, selectedMethod])

  const getPaymentMethodIcon = (code: string) => {
    switch (code) {
      case 'CASH': return <Banknote className="w-5 h-5" />
      case 'CARD': return <CreditCard className="w-5 h-5" />
      case 'DANKORT': return <CreditCard className="w-5 h-5" />
      case 'MOBILE_PAY': return <Smartphone className="w-5 h-5" />
      case 'GIFT_CARD': return <Gift className="w-5 h-5" />
      case 'BANK_TRANSFER': return <Building className="w-5 h-5" />
      case 'PAYPAL': return <CreditCard className="w-5 h-5" />
      case 'SWISH': return <Smartphone className="w-5 h-5" />
      case 'VIPPS': return <Smartphone className="w-5 h-5" />
      case 'APPLE_PAY': return <Smartphone className="w-5 h-5" />
      case 'GOOGLE_PAY': return <Smartphone className="w-5 h-5" />
      case 'KLARNA': return <CreditCard className="w-5 h-5" />
      default: return <CreditCard className="w-5 h-5" />
    }
  }

  const handlePayment = async () => {
    if (isProcessing) return

    // Validation
    if (selectedMethod === 'CASH' && cashAmount < finalAmount) {
      alert(`Insufficient cash. Received: ${cashAmount} kr, Required: ${finalAmount} kr`)
      return
    }

    if (selectedMethod === 'GIFT_CARD') {
      if (!giftCardCode.trim()) {
        alert('Please enter a gift card code')
        return
      }
      if (giftCardBalance === null || giftCardBalance < finalAmount) {
        alert('Gift card has insufficient balance')
        return
      }
    }

    setIsProcessing(true)

    // Debug logging
    console.log('[PaymentModal] Payment details:', {
      totalAmount,
      discountAmount,
      finalAmount,
      selectedMethod,
      selectedGroup: selectedGroup?.name
    })

    // Additional validation
    if (finalAmount <= 0) {
      alert(`Ugyldig betalingsbeløb: ${finalAmount.toFixed(2)} kr. Beløbet skal være positivt.`)
      setIsProcessing(false)
      return
    }

    try {
      const paymentResult = await recordPayment.mutateAsync({
        order_id: orderId,
        payment_type_code: selectedMethod,
        amount: finalAmount,
        reference_number: selectedMethod === 'GIFT_CARD' ? giftCardCode : undefined,
        metadata: {
          cash_received: selectedMethod === 'CASH' ? cashAmount : undefined,
          change_given: selectedMethod === 'CASH' ? change : undefined,
          gift_card_code: selectedMethod === 'GIFT_CARD' ? giftCardCode : undefined,
          gift_card_balance_before: selectedMethod === 'GIFT_CARD' ? giftCardBalance : undefined,
          customer_name: customerName,
          customer_group_id: selectedCustomerGroup || undefined,
          discount_applied: discountAmount > 0 ? discountAmount : undefined,
          original_amount: discountAmount > 0 ? totalAmount : undefined
        },
        notes: selectedGroup ? `Customer group: ${selectedGroup.name}` : undefined
      })

      const paymentId = crypto.randomUUID()

      const paymentDetails: PaymentDetails = {
        payment_id: paymentId,
        method: selectedPaymentType?.name || selectedMethod,
        amount: finalAmount,
        reference: selectedMethod === 'GIFT_CARD' ? giftCardCode : undefined,
        change: change > 0 ? change : undefined,
        customer_group_id: selectedCustomerGroup || undefined,
        gift_card_balance: selectedMethod === 'GIFT_CARD' && giftCardBalance ? giftCardBalance - finalAmount : undefined
      }

      // Record customer group purchase if a group was selected
      if (selectedCustomerGroup && selectedGroup) {
        try {
          await recordCustomerGroupPurchase.mutateAsync({
            customer_group_id: selectedCustomerGroup,
            order_id: orderId,
            customer_name: customerName || 'Anonymous',
            total_amount: totalAmount,
            discount_applied: discountAmount,
            items_count: 1, // You might want to pass this as a prop
            notes: `Payment via ${selectedMethod} with ${selectedGroup.name} discount`
          })
        } catch (groupError) {
          console.warn('Failed to record customer group purchase:', groupError)
          // Don't fail the payment if group recording fails
        }
      }

      onPaymentComplete(paymentDetails)
      
      // Show success message
      const paymentMethod = selectedPaymentType?.name || selectedMethod
      const successMessage = `Payment successful! ${paymentMethod}: ${finalAmount.toFixed(2)} kr`
      
      // Use a more user-friendly notification
      if (typeof window !== 'undefined' && window.alert) {
        alert(successMessage)
      } else {
        console.info('[payment-success]', successMessage)
      }
      
      onClose()

    } catch (error) {
      console.error('Payment error:', error)
      
      // Check if it's a database setup issue
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        alert('Payment processed in demo mode. Set up database for full functionality.')
      } else {
        alert('Payment failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (loadingPaymentTypes) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[600px]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading payment methods...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[700px] p-0">
        <div className="flex h-full">
          {/* Left Panel - Payment Methods */}
          <div className="w-2/5 bg-gray-50 border-r">
            {/* Header */}
            <div className="p-6 border-b bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Betaling
                </DialogTitle>
              </DialogHeader>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount */}
            <div className="p-6 bg-white border-b">
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total at betale:</div>
                <div className="text-3xl font-bold">{finalAmount.toFixed(2)} kr.</div>
                {discountAmount > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    Rabat: -{discountAmount.toFixed(2)} kr (fra {totalAmount.toFixed(2)} kr)
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Vælg betalingsmetode:
              </div>
              
              <div className="space-y-2">
                {paymentTypes?.map((method) => (
                  <button
                    key={method.code}
                    onClick={() => setSelectedMethod(method.code)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedMethod === method.code
                        ? 'bg-pink-500 text-white border-pink-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(method.code)}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className={`text-sm ${
                          selectedMethod === method.code ? 'text-pink-100' : 'text-gray-500'
                        }`}>
                          {method.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Group Section */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                Kundegruppe
              </div>
              
              <select
                value={selectedCustomerGroup}
                onChange={(e) => setSelectedCustomerGroup(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Vælg</option>
                {customerGroups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.discount_percentage ? `(${group.discount_percentage}% rabat)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Panel - Payment Details */}
          <div className="flex-1 bg-white">
            {/* Method-specific content */}
            <div className="p-6 h-full flex flex-col">
              
              {/* Gift Card Payment */}
              {selectedMethod === 'GIFT_CARD' && (
                <div className="flex-1">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Gift className="w-6 h-6 text-pink-600" />
                      <h3 className="text-xl font-semibold text-pink-800">Gavekort betaling</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="giftCardCode" className="text-sm font-medium mb-2 block">
                          Gavekort kode:
                        </Label>
                        <Input
                          id="giftCardCode"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          placeholder="Indtast gavekort kode"
                          className="text-center font-mono text-lg p-4"
                        />
                      </div>

                      {isValidatingGiftCard && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-2"></div>
                          <div className="text-sm text-gray-600">Validerer gavekort...</div>
                        </div>
                      )}

                      {giftCardBalance !== null && !isValidatingGiftCard && (
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <div className="text-sm text-gray-600 mb-1">Saldo på gavekort:</div>
                          <div className="text-2xl font-bold text-green-600">
                            {giftCardBalance.toFixed(2)} kr
                          </div>
                          {giftCardBalance < finalAmount && (
                            <div className="text-sm text-red-600 mt-2">
                              ⚠️ Utilstrækkelig saldo (mangler {(finalAmount - giftCardBalance).toFixed(2)} kr)
                            </div>
                          )}
                        </div>
                      )}

                      {giftCardCode.trim() && giftCardBalance === null && !isValidatingGiftCard && (
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-red-600">❌ Ugyldigt gavekort</div>
                          <div className="text-sm text-red-500 mt-1">
                            Indtast gavekort koden og klik på Valider for at tjekke saldoen
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Payment */}
              {selectedMethod === 'CASH' && (
                <div className="flex-1">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Banknote className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-semibold text-green-800">Kontant</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cashReceived" className="text-sm font-medium mb-2 block">
                          Betaling med kontanter
                        </Label>
                        <Input
                          id="cashReceived"
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="text-center font-mono text-xl p-4"
                        />
                      </div>

                      {cashAmount > 0 && (
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-4 bg-white rounded-lg border">
                            <div className="text-sm text-gray-600 mb-1">At betale:</div>
                            <div className="text-lg font-bold">{finalAmount.toFixed(2)} kr</div>
                          </div>
                          <div className="p-4 bg-white rounded-lg border">
                            <div className="text-sm text-gray-600 mb-1">Modtaget:</div>
                            <div className="text-lg font-bold">{cashAmount.toFixed(2)} kr</div>
                          </div>
                        </div>
                      )}

                      {change > 0 && (
                        <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm text-yellow-700 mb-1">Returpenge:</div>
                          <div className="text-3xl font-bold text-yellow-600">
                            {change.toFixed(2)} kr
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card/Other Payment Methods */}
              {!['CASH', 'GIFT_CARD'].includes(selectedMethod) && (
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      {getPaymentMethodIcon(selectedMethod)}
                      <h3 className="text-xl font-semibold text-blue-800">
                        {selectedPaymentType?.name}
                      </h3>
                    </div>
                    
                    <div className="text-center py-8">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {finalAmount.toFixed(2)} kr
                      </div>
                      <div className="text-blue-600">
                        {selectedMethod === 'MOBILE_PAY' && 'Scan QR-koden med MobilePay'}
                        {selectedMethod === 'CARD' && 'Indsæt eller tryk kort på terminalen'}
                        {selectedMethod === 'DANKORT' && 'Indsæt Dankort i terminalen'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-auto">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 py-3 text-lg"
                >
                  Annuller
                </Button>
                <Button 
                  onClick={handlePayment}
                  disabled={
                    isProcessing || 
                    (selectedMethod === 'CASH' && cashAmount < finalAmount) ||
                    (selectedMethod === 'GIFT_CARD' && (giftCardBalance === null || giftCardBalance < finalAmount))
                  }
                  className="flex-1 py-3 text-lg bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Behandler...
                    </div>
                  ) : (
                    <>
                      → Gennemfør betaling ({finalAmount.toFixed(2)} DKK)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}