import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Types
export interface PaymentTransaction {
  id: string
  order_id: string
  amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed'
  transaction_id?: string
  created_at: string
  updated_at: string
}

export interface ZReportData {
  date: string
  total_sales: number
  total_transactions: number
  payment_methods: Array<{
    method: string
    amount: number
    count: number
  }>
  tax_summary: Array<{
    rate: number
    net_amount: number
    tax_amount: number
    gross_amount: number
  }>
}

// Record a payment transaction using the new payment system
export function useRecordPayment() {
  return useMutation({
    mutationFn: async (payment: {
      order_id: string
      amount: number
      payment_method: string
      transaction_id?: string
      cash_received?: number
      change_given?: number
      metadata?: any
    }) => {
      // Debug logging
      console.log('[useRecordPayment] Payment data:', {
        order_id: payment.order_id,
        payment_method: payment.payment_method,
        amount: payment.amount,
        amount_type: typeof payment.amount,
        cash_received: payment.cash_received,
        change_given: payment.change_given
      })

      // Validate amount before sending to database
      if (!payment.amount || payment.amount <= 0) {
        console.error('[useRecordPayment] Invalid amount:', payment.amount)
        throw new Error(`Invalid payment amount: ${payment.amount}. Amount must be positive.`)
      }

      // Generate idempotency key to prevent duplicate payments
      const idempotencyKey = payment.transaction_id || `pay_${payment.order_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('[useRecordPayment] Using idempotency key:', idempotencyKey)
      
      // Map payment method to correct database code
      const paymentTypeCodeMap: Record<string, string> = {
        'Cash': 'CASH',
        'cash': 'CASH',
        'CASH': 'CASH',
        'Card': 'CARD',
        'card': 'CARD',
        'CARD': 'CARD',
        'Mobile Pay': 'MOBILE_PAY',
        'mobile_pay': 'MOBILE_PAY',
        'MOBILE_PAY': 'MOBILE_PAY',
        'Gift Card': 'GIFT_CARD',
        'gift_card': 'GIFT_CARD',
        'GIFT_CARD': 'GIFT_CARD'
      }
      
      const paymentTypeCode = paymentTypeCodeMap[payment.payment_method] || payment.payment_method || 'CASH'
      
      console.log('[useRecordPayment] Payment method mapping:', {
        original: payment.payment_method,
        mapped: paymentTypeCode
      })
      
      // Use the record_payment function with new parameter order
      const { data, error } = await supabase
        .rpc('record_payment', {
          p_order_id: payment.order_id,
          p_payment_type_code: paymentTypeCode,
          p_amount: payment.amount,
          p_idempotency_key: idempotencyKey,
          p_reference_number: payment.transaction_id || null,
          p_processed_by: null,
          p_metadata: {
            ...payment.metadata,
            cash_received: payment.cash_received,
            change_given: payment.change_given
          },
          p_notes: null
        })
      
      if (error) {
        console.error('[record-payment] Full error:', error)
        console.error('[record-payment] Error details:', error.details)
        console.error('[record-payment] Error hint:', error.hint)
        
        // Provide specific error messages for common issues
        if (error.message?.includes('order_number')) {
          throw new Error('Database schema error: Missing order_number column. Please run the fix-order-number-column.sql script.')
        }
        
        if (error.message?.includes('payment_types')) {
          throw new Error('Payment type not found. Please run the ensure-payment-types.sql script.')
        }
        
        throw new Error(`Payment failed: ${error.message}`)
      }
      
      // Debug what we got back from the RPC call
      console.log('[record-payment] RPC returned data:', data)
      console.log('[record-payment] Data type:', typeof data)
      
      if (!data) {
        throw new Error('Payment failed: No transaction ID returned from database')
      }
      
      // The RPC returns a UUID (transaction ID), not an object
      return { 
        id: data,           // data is the transaction UUID
        transaction_id: data,
        status: 'completed',
        ...payment 
      }
    }
  })
}

// Get payment transactions
export function usePaymentTransactions(orderId?: string) {
  return useQuery({
    queryKey: ['payment-transactions', orderId],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (orderId) {
        query = query.eq('order_id', orderId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PaymentTransaction[]
    }
  })
}

// Get Z-report data for a specific date
export function useZReportData(date?: string) {
  return useQuery({
    queryKey: ['z-report', date],
    queryFn: async () => {
      const targetDate = date || new Date().toISOString().split('T')[0]
      
      // This would typically be a more complex query or stored procedure
      // For now, return mock data
      const mockData: ZReportData = {
        date: targetDate,
        total_sales: 12450.00,
        total_transactions: 87,
        payment_methods: [
          { method: 'cash', amount: 3200.00, count: 25 },
          { method: 'card', amount: 8100.00, count: 55 },
          { method: 'mobile_pay', amount: 1150.00, count: 7 }
        ],
        tax_summary: [
          { rate: 25, net_amount: 9960.00, tax_amount: 2490.00, gross_amount: 12450.00 }
        ]
      }

      return mockData
    },
    enabled: !!date
  })
}

// Process refund
export function useProcessRefund() {
  return useMutation({
    mutationFn: async (refund: {
      original_transaction_id: string
      amount: number
      reason: string
    }) => {
      // In a real implementation, this would process the refund through the payment provider
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([{
          order_id: 'refund', // This would be linked to the original order
          amount: -refund.amount, // Negative amount for refunds
          payment_method: 'refund',
          status: 'completed',
          transaction_id: `refund_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    }
  })
}
