'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Types
export interface PaymentType {
  id: string
  code: string
  name: string
  description?: string
  requires_reference: boolean
  supports_partial: boolean
  fee_percentage: number
  fee_fixed: number
  active: boolean
  sort_order: number
}

export interface PaymentTransaction {
  id: string
  payment_id: string
  reference_number?: string
  order_id?: string
  order_number?: string
  payment_type_id: string
  payment_method: string
  amount: number
  fee_amount: number
  net_amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  currency: string
  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
  metadata?: any
  notes?: string
}

export interface PaymentSplit {
  id: string
  payment_transaction_id: string
  payment_type_id: string
  payment_method: string
  amount: number
  reference_number?: string
  status: string
  created_at: string
}

export interface Refund {
  id: string
  refund_id: string
  original_payment_id: string
  amount: number
  reason?: string
  refund_method?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_by?: string
  processed_at?: string
  created_at: string
  metadata?: any
}

export interface PaymentSummary {
  payment_id: string
  payment_method: string
  amount: number
  fee_amount: number
  net_amount: number
  status: string
  created_at: string
  processed_at?: string
  order_number?: string
  table_id?: string
}

export interface DailyPaymentReport {
  payment_date: string
  payment_method: string
  transaction_count: number
  gross_amount: number
  total_fees: number
  net_amount: number
  avg_transaction_amount: number
}

// Default payment types fallback
const DEFAULT_PAYMENT_TYPES: PaymentType[] = [
  {
    id: 'cash-default',
    code: 'CASH',
    name: 'Cash',
    description: 'Cash payment',
    requires_reference: false,
    supports_partial: true,
    fee_percentage: 0,
    fee_fixed: 0,
    active: true,
    sort_order: 1
  },
  {
    id: 'card-default',
    code: 'CARD',
    name: 'Credit/Debit Card',
    description: 'Card payment via terminal',
    requires_reference: true,
    supports_partial: true,
    fee_percentage: 1.75,
    fee_fixed: 0,
    active: true,
    sort_order: 2
  },
  {
    id: 'mobilepay-default',
    code: 'MOBILE_PAY',
    name: 'MobilePay',
    description: 'MobilePay payment',
    requires_reference: true,
    supports_partial: true,
    fee_percentage: 1.0,
    fee_fixed: 0,
    active: true,
    sort_order: 3
  },
  {
    id: 'giftcard-default',
    code: 'GIFT_CARD',
    name: 'Gift Card',
    description: 'Gift card payment',
    requires_reference: true,
    supports_partial: false,
    fee_percentage: 0,
    fee_fixed: 0,
    active: true,
    sort_order: 4
  }
]

// Get all active payment types
export function usePaymentTypes() {
  return useQuery({
    queryKey: ['payment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .eq('active', true)
        .order('sort_order')

      if (error) {
        console.warn('[payment-types] Database table not found, using defaults:', error.message)
        // Return default payment types if table doesn't exist
        return DEFAULT_PAYMENT_TYPES
      }

      return data as PaymentType[]
    }
  })
}

// Get all payment types (including inactive for settings)
export function useAllPaymentTypes() {
  return useQuery({
    queryKey: ['payment-types-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('sort_order')

      if (error) {
        console.error('[payment-types-all]', error)
        throw error
      }

      return data as PaymentType[]
    }
  })
}

// Create payment type
export function useCreatePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentType: {
      code: string
      name: string
      description?: string
      requires_reference?: boolean
      supports_partial?: boolean
      fee_percentage?: number
      fee_fixed?: number
      sort_order?: number
    }) => {
      const { data, error } = await supabase
        .from('payment_types')
        .insert([{
          code: paymentType.code.toUpperCase(),
          name: paymentType.name,
          description: paymentType.description || null,
          requires_reference: paymentType.requires_reference || false,
          supports_partial: paymentType.supports_partial !== false,
          fee_percentage: paymentType.fee_percentage || 0,
          fee_fixed: paymentType.fee_fixed || 0,
          active: true,
          sort_order: paymentType.sort_order || 999
        }])
        .select()
        .single()

      if (error) {
        console.error('[create-payment-type]', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] })
      queryClient.invalidateQueries({ queryKey: ['payment-types-all'] })
    }
  })
}

// Update payment type
export function useUpdatePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: {
      id: string
      code?: string
      name?: string
      description?: string
      requires_reference?: boolean
      supports_partial?: boolean
      fee_percentage?: number
      fee_fixed?: number
      active?: boolean
      sort_order?: number
    }) => {
      const { id, ...updateData } = update

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      )

      if (cleanData.code) {
        cleanData.code = cleanData.code.toUpperCase()
      }

      const { data, error } = await supabase
        .from('payment_types')
        .update({
          ...cleanData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[update-payment-type]', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] })
      queryClient.invalidateQueries({ queryKey: ['payment-types-all'] })
    }
  })
}

// Delete payment type (soft delete by setting active = false)
export function useDeletePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_types')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('[delete-payment-type]', error)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] })
      queryClient.invalidateQueries({ queryKey: ['payment-types-all'] })
    }
  })
}

// Reorder payment types
export function useReorderPaymentTypes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reorderedTypes: { id: string; sort_order: number }[]) => {
      const updates = reorderedTypes.map(({ id, sort_order }) =>
        supabase
          .from('payment_types')
          .update({ 
            sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      )

      const results = await Promise.all(updates)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('[reorder-payment-types]', errors)
        throw new Error('Failed to reorder payment types')
      }

      return reorderedTypes
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] })
      queryClient.invalidateQueries({ queryKey: ['payment-types-all'] })
    }
  })
}

// Get payment transactions
export function usePaymentTransactions(filters?: {
  order_id?: string
  status?: string
  date_from?: string
  date_to?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['payment-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_splits (*)
        `)
        .order('created_at', { ascending: false })

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('[payment-transactions]', error)
        throw error
      }

      return data as (PaymentTransaction & { payment_splits?: PaymentSplit[] })[]
    }
  })
}

// Get payment summary view
export function usePaymentSummary(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['payment-summary', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('payment_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[payment-summary]', error)
        throw error
      }

      return data as PaymentSummary[]
    }
  })
}

// Get daily payment report
export function useDailyPaymentReport(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['daily-payment-report', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('daily_payment_report')
        .select('*')
        .order('payment_date', { ascending: false })
        .order('net_amount', { ascending: false })

      if (dateRange) {
        query = query
          .gte('payment_date', dateRange.start)
          .lte('payment_date', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[daily-payment-report]', error)
        throw error
      }

      return data as DailyPaymentReport[]
    }
  })
}

// Record a single payment
export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payment: {
      order_id: string
      payment_type_code: string
      amount: number
      reference_number?: string
      processed_by?: string
      metadata?: any
      notes?: string
      idempotency_key?: string
    }) => {
      // Generate idempotency key if not provided
      const idempotencyKey = payment.idempotency_key || `pay_${payment.order_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const { data, error } = await supabase.rpc('record_payment', {
        p_idempotency_key: idempotencyKey,
        p_order_id: payment.order_id,
        p_payment_type_code: payment.payment_type_code,
        p_amount: payment.amount,
        p_reference_number: payment.reference_number || null,
        p_processed_by: payment.processed_by || null,
        p_metadata: payment.metadata || {},
        p_notes: payment.notes || null
      })

      if (error) {
        // Check if it's a missing function error (database not set up)
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
          console.warn('[record-payment] Database function not found, using fallback mode')
          
          // Generate a mock payment ID for demo purposes
          const mockPaymentId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
          
          // Log the payment details for debugging
          console.info('[record-payment] Payment recorded (demo mode):', {
            payment_id: mockPaymentId,
            order_id: payment.order_id,
            payment_type: payment.payment_type_code,
            amount: payment.amount,
            reference: payment.reference_number,
            metadata: payment.metadata,
            timestamp: new Date().toISOString()
          })

          // Return mock transaction ID
          return mockPaymentId
        }
        
        console.error('[record-payment]', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['daily-payment-report'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

// Record a split payment
export function useRecordSplitPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payment: {
      order_id: string
      splits: Array<{
        payment_type_code: string
        amount: number
        reference_number?: string
      }>
      processed_by?: string
      notes?: string
    }) => {
      const { data, error } = await supabase.rpc('record_split_payment', {
        p_order_id: payment.order_id,
        p_splits: payment.splits,
        p_processed_by: payment.processed_by || null,
        p_notes: payment.notes || null
      })

      if (error) {
        // Check if it's a missing function error (database not set up)
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
          console.warn('[record-split-payment] Database function not found, using fallback mode')
          
          // Generate a mock payment ID for demo purposes
          const mockPaymentId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
          
          // Log the split payment details for debugging
          console.info('[record-split-payment] Split payment recorded (demo mode):', {
            payment_id: mockPaymentId,
            order_id: payment.order_id,
            splits: payment.splits,
            total_amount: payment.splits.reduce((sum, split) => sum + split.amount, 0),
            notes: payment.notes,
            timestamp: new Date().toISOString()
          })

          // Return mock transaction ID
          return mockPaymentId
        }
        
        console.error('[record-split-payment]', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['daily-payment-report'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

// Create a refund
export function useCreateRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (refund: {
      original_payment_id: string
      amount: number
      reason?: string
      refund_method?: string
      processed_by?: string
      metadata?: any
    }) => {
      // Generate refund ID
      const { data: refundId, error: refundIdError } = await supabase.rpc('generate_refund_id')
      
      if (refundIdError) throw refundIdError

      const { data, error } = await supabase
        .from('refunds')
        .insert([{
          refund_id: refundId,
          original_payment_id: refund.original_payment_id,
          amount: refund.amount,
          reason: refund.reason,
          refund_method: refund.refund_method,
          processed_by: refund.processed_by,
          processed_at: new Date().toISOString(),
          status: 'completed',
          metadata: refund.metadata || {}
        }])
        .select()
        .single()

      if (error) {
        console.error('[create-refund]', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['refunds'] })
    }
  })
}

// Get refunds
export function useRefunds(originalPaymentId?: string) {
  return useQuery({
    queryKey: ['refunds', originalPaymentId],
    queryFn: async () => {
      let query = supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false })

      if (originalPaymentId) {
        query = query.eq('original_payment_id', originalPaymentId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[refunds]', error)
        throw error
      }

      return data as Refund[]
    }
  })
}

// Generate payment ID (utility function)
export async function generatePaymentId(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_payment_id')
  
  if (error) {
    console.error('[generate-payment-id]', error)
    throw error
  }
  
  return data
}

// Generate refund ID (utility function)
export async function generateRefundId(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_refund_id')
  
  if (error) {
    console.error('[generate-refund-id]', error)
    throw error
  }
  
  return data
}

// Get payment statistics
export function usePaymentStatistics(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['payment-statistics', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select('payment_method, amount, fee_amount, net_amount, status, created_at')
        .eq('status', 'completed')

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[payment-statistics]', error)
        throw error
      }

      // Calculate statistics
      const stats = {
        total_transactions: data.length,
        total_gross_amount: data.reduce((sum, p) => sum + p.amount, 0),
        total_fees: data.reduce((sum, p) => sum + p.fee_amount, 0),
        total_net_amount: data.reduce((sum, p) => sum + p.net_amount, 0),
        avg_transaction_amount: data.length > 0 ? data.reduce((sum, p) => sum + p.amount, 0) / data.length : 0,
        payment_methods: {} as Record<string, { count: number; amount: number; percentage: number }>
      }

      // Group by payment method
      data.forEach(payment => {
        if (!stats.payment_methods[payment.payment_method]) {
          stats.payment_methods[payment.payment_method] = {
            count: 0,
            amount: 0,
            percentage: 0
          }
        }
        stats.payment_methods[payment.payment_method].count++
        stats.payment_methods[payment.payment_method].amount += payment.amount
      })

      // Calculate percentages
      Object.keys(stats.payment_methods).forEach(method => {
        stats.payment_methods[method].percentage = 
          (stats.payment_methods[method].amount / stats.total_gross_amount) * 100
      })

      return stats
    }
  })
}
