import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useCompany } from './useCompany'

export interface PaymentRecord {
  id: string
  company_id: string
  order_id?: string
  table_id?: string
  payment_method: string
  amount: number
  currency: string
  reference?: string
  cash_received?: number
  change_given?: number
  customer_group_id?: string
  discount_amount?: number
  gift_card_code?: string
  gift_card_amount?: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processed_at: string
  created_at: string
  created_by?: string
  metadata?: any
}

export interface CreatePaymentParams {
  orderId?: string
  tableId?: string
  paymentDetails: {
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
}

export interface PaymentStats {
  totalPayments: number
  totalAmount: number
  paymentsByMethod: Record<string, { count: number; amount: number }>
  averageTransaction: number
  todayTotal: number
}

class PaymentService {
  /**
   * Record a new payment
   */
  async recordPayment(companyId: string, params: CreatePaymentParams) {
    try {
      const paymentData = {
        company_id: companyId,
        order_id: params.orderId || null,
        table_id: params.tableId || null,
        payment_method: params.paymentDetails.method,
        amount: params.paymentDetails.amount,
        currency: 'DKK',
        reference: params.paymentDetails.reference,
        cash_received: params.paymentDetails.cashReceived || null,
        change_given: params.paymentDetails.changeGiven || null,
        customer_group_id: params.paymentDetails.customerGroup?.id || null,
        discount_amount: params.paymentDetails.discountAmount || null,
        gift_card_code: params.paymentDetails.giftCardCode || null,
        gift_card_amount: params.paymentDetails.giftCardAmount || null,
        status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: {
          customerGroupName: params.paymentDetails.customerGroup?.display_name,
          discountPercentage: params.paymentDetails.customerGroup?.discount_percentage
        }
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single()

      if (error) {
        console.error('Error recording payment:', error)
        throw new Error(error.message)
      }

      // If gift card was used, redeem it
      if (params.paymentDetails.giftCardCode && params.paymentDetails.giftCardAmount) {
        const { error: redeemError } = await supabase.rpc('redeem_gift_card', {
          p_code: params.paymentDetails.giftCardCode,
          p_amount: params.paymentDetails.giftCardAmount,
          p_order_id: params.orderId || null
        })

        if (redeemError) {
          console.error('Error redeeming gift card:', redeemError)
          // Don't fail the payment if gift card redemption fails
        }
      }

      return data as PaymentRecord
    } catch (error) {
      console.error('Error in recordPayment:', error)
      throw error
    }
  }

  /**
   * Get payments for a company
   */
  async getPayments(companyId: string, options?: {
    limit?: number
    offset?: number
    dateFrom?: string
    dateTo?: string
    method?: string
    status?: string
  }) {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          customer_groups(display_name, discount_percentage)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (options?.dateFrom) {
        query = query.gte('created_at', options.dateFrom)
      }

      if (options?.dateTo) {
        query = query.lte('created_at', options.dateTo)
      }

      if (options?.method) {
        query = query.eq('payment_method', options.method)
      }

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching payments:', error)
        throw new Error(error.message)
      }

      return data as PaymentRecord[]
    } catch (error) {
      console.error('Error in getPayments:', error)
      throw error
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(companyId: string, dateFrom?: string, dateTo?: string): Promise<PaymentStats> {
    try {
      let query = supabase
        .from('payments')
        .select('payment_method, amount, created_at')
        .eq('company_id', companyId)
        .eq('status', 'completed')

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      const stats: PaymentStats = {
        totalPayments: data.length,
        totalAmount: data.reduce((sum, payment) => sum + payment.amount, 0),
        paymentsByMethod: {},
        averageTransaction: 0,
        todayTotal: 0
      }

      // Calculate payments by method
      data.forEach(payment => {
        if (!stats.paymentsByMethod[payment.payment_method]) {
          stats.paymentsByMethod[payment.payment_method] = { count: 0, amount: 0 }
        }
        stats.paymentsByMethod[payment.payment_method].count++
        stats.paymentsByMethod[payment.payment_method].amount += payment.amount
      })

      // Calculate average transaction
      stats.averageTransaction = stats.totalPayments > 0 ? stats.totalAmount / stats.totalPayments : 0

      // Calculate today's total
      const today = new Date().toISOString().split('T')[0]
      stats.todayTotal = data
        .filter(payment => payment.created_at.startsWith(today))
        .reduce((sum, payment) => sum + payment.amount, 0)

      return stats
    } catch (error) {
      console.error('Error in getPaymentStats:', error)
      throw error
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          metadata: { refund_reason: reason, refunded_at: new Date().toISOString() }
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) throw error

      return data as PaymentRecord
    } catch (error) {
      console.error('Error in refundPayment:', error)
      throw error
    }
  }
}

const paymentService = new PaymentService()

export function useRecordPayment() {
  const queryClient = useQueryClient()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (params: CreatePaymentParams) => 
      paymentService.recordPayment(company!.id, params),
    onSuccess: () => {
      // Invalidate payment-related queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] })
      queryClient.invalidateQueries({ queryKey: ['giftCards'] }) // In case gift card was used
    },
  })
}

export function usePayments(options?: {
  limit?: number
  offset?: number
  dateFrom?: string
  dateTo?: string
  method?: string
  status?: string
}) {
  const { company } = useCompany()

  return useQuery({
    queryKey: ['payments', company?.id, options],
    queryFn: () => paymentService.getPayments(company!.id, options),
    enabled: !!company?.id,
    staleTime: 30000, // 30 seconds
  })
}

export function usePaymentStats(dateFrom?: string, dateTo?: string) {
  const { company } = useCompany()

  return useQuery({
    queryKey: ['paymentStats', company?.id, dateFrom, dateTo],
    queryFn: () => paymentService.getPaymentStats(company!.id, dateFrom, dateTo),
    enabled: !!company?.id,
    staleTime: 60000, // 1 minute
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason?: string }) =>
      paymentService.refundPayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] })
    },
  })
}
