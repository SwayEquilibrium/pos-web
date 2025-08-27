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

      try {
        // Fetch payment transactions for the specified date
        const { data: transactions, error: transactionsError } = await supabase
          .from('payment_transactions')
          .select(`
            amount,
            payment_type_code,
            created_at,
            order_id,
            orders!inner(total_amount)
          `)
          .eq('status', 'completed')
          .gte('created_at', `${targetDate}T00:00:00.000Z`)
          .lt('created_at', `${targetDate}T23:59:59.999Z`)

        if (transactionsError) {
          console.error('[useZReportData] Error fetching transactions:', transactionsError)
          throw transactionsError
        }

        // Calculate totals and breakdowns
        const totalSales = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
        const totalTransactions = transactions?.length || 0

        // Group by payment method
        const paymentMethodGroups = transactions?.reduce((acc, transaction) => {
          const method = transaction.payment_type_code || 'UNKNOWN'
          if (!acc[method]) {
            acc[method] = { amount: 0, count: 0 }
          }
          acc[method].amount += transaction.amount || 0
          acc[method].count += 1
          return acc
        }, {} as Record<string, { amount: number; count: number }>) || {}

        const paymentMethods = Object.entries(paymentMethodGroups).map(([method, data]) => ({
          method: method.toLowerCase(),
          amount: data.amount,
          count: data.count
        }))

        // Calculate Danish VAT (Moms) - standard rate is 25%
        const vatRate = 25
        const netAmount = totalSales / (1 + vatRate / 100)
        const vatAmount = totalSales - netAmount

        const taxSummary = totalSales > 0 ? [{
          rate: vatRate,
          net_amount: Math.round(netAmount * 100) / 100,
          tax_amount: Math.round(vatAmount * 100) / 100,
          gross_amount: Math.round(totalSales * 100) / 100
        }] : []

        const zReportData: ZReportData = {
          date: targetDate,
          total_sales: Math.round(totalSales * 100) / 100,
          total_transactions: totalTransactions,
          payment_methods: paymentMethods,
          tax_summary: taxSummary
        }

        console.log('[useZReportData] Generated Z-rapport:', zReportData)
        return zReportData

      } catch (error) {
        console.error('[useZReportData] Error generating Z-rapport:', error)
        // Return empty report instead of throwing to prevent UI crashes
        return {
          date: targetDate,
          total_sales: 0,
          total_transactions: 0,
          payment_methods: [],
          tax_summary: []
        }
      }
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
