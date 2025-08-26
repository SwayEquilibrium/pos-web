'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PaymentModal, { PaymentDetails } from '@/components/PaymentModal'

export default function PaymentTest() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [lastPayment, setLastPayment] = useState<PaymentDetails | null>(null)

  const handlePaymentComplete = (payment: PaymentDetails) => {
    setLastPayment(payment)
    console.log('Payment completed:', payment)
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Payment System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Test the payment system with fallback data. Works even without database setup.
        </div>
        
        <Button 
          onClick={() => setShowPaymentModal(true)}
          className="w-full"
        >
          Test Payment (150.00 kr)
        </Button>

        {lastPayment && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-2">Last Payment:</div>
            <div className="text-xs space-y-1 text-green-700">
              <div><strong>ID:</strong> {lastPayment.payment_id}</div>
              <div><strong>Method:</strong> {lastPayment.method}</div>
              <div><strong>Amount:</strong> {lastPayment.amount.toFixed(2)} kr</div>
              {lastPayment.reference && (
                <div><strong>Reference:</strong> {lastPayment.reference}</div>
              )}
              {lastPayment.change && (
                <div><strong>Change:</strong> {lastPayment.change.toFixed(2)} kr</div>
              )}
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId="test-order-123"
          totalAmount={150.00}
          onPaymentComplete={handlePaymentComplete}
          customerName="Test Customer"
        />
      </CardContent>
    </Card>
  )
}
