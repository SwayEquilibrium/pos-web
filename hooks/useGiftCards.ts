'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Types
export interface GiftCard {
  id: string
  code: string
  balance: number
  original_amount: number
  status: 'active' | 'used' | 'expired' | 'cancelled'
  expires_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  notes?: string
}

export interface GiftCardTransaction {
  id: string
  gift_card_id: string
  transaction_type: 'issue' | 'redeem' | 'refund'
  amount: number
  balance_after: number
  order_id?: string
  created_at: string
  created_by?: string
  notes?: string
}

// Get gift cards
export function useGiftCards() {
  return useQuery({
    queryKey: ['gift-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[gift-cards]', error)
        throw error
      }

      return data as GiftCard[]
    }
  })
}

// Validate gift card and get balance
export function useValidateGiftCard() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Gift card not found or inactive')
        }
        throw error
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Gift card has expired')
      }

      return {
        id: data.id,
        code: data.code,
        balance: data.balance,
        original_amount: data.original_amount,
        expires_at: data.expires_at
      }
    }
  })
}

// Create/Issue gift card
export function useCreateGiftCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (giftCard: {
      amount: number
      expires_at?: string
      notes?: string
      created_by?: string
    }) => {
      // Generate gift card code
      const code = generateGiftCardCode()

      const { data, error } = await supabase
        .from('gift_cards')
        .insert([{
          code,
          balance: giftCard.amount,
          original_amount: giftCard.amount,
          status: 'active',
          expires_at: giftCard.expires_at || null,
          notes: giftCard.notes,
          created_by: giftCard.created_by
        }])
        .select()
        .single()

      if (error) {
        console.error('[create-gift-card]', error)
        throw error
      }

      // Record transaction
      await supabase
        .from('gift_card_transactions')
        .insert([{
          gift_card_id: data.id,
          transaction_type: 'issue',
          amount: giftCard.amount,
          balance_after: giftCard.amount,
          created_by: giftCard.created_by,
          notes: 'Gift card issued'
        }])

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] })
    }
  })
}

// Redeem gift card (use for payment)
export function useRedeemGiftCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (redemption: {
      gift_card_id: string
      amount: number
      order_id?: string
      created_by?: string
      notes?: string
    }) => {
      // Get current gift card
      const { data: giftCard, error: fetchError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('id', redemption.gift_card_id)
        .single()

      if (fetchError) throw fetchError

      if (giftCard.balance < redemption.amount) {
        throw new Error('Insufficient gift card balance')
      }

      const newBalance = giftCard.balance - redemption.amount
      const newStatus = newBalance <= 0 ? 'used' : 'active'

      // Update gift card balance
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({
          balance: newBalance,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', redemption.gift_card_id)

      if (updateError) throw updateError

      // Record transaction
      const { data, error: transactionError } = await supabase
        .from('gift_card_transactions')
        .insert([{
          gift_card_id: redemption.gift_card_id,
          transaction_type: 'redeem',
          amount: -redemption.amount, // Negative for redemption
          balance_after: newBalance,
          order_id: redemption.order_id,
          created_by: redemption.created_by,
          notes: redemption.notes || 'Gift card redeemed'
        }])
        .select()
        .single()

      if (transactionError) throw transactionError

      return {
        transaction: data,
        new_balance: newBalance,
        gift_card_status: newStatus
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] })
      queryClient.invalidateQueries({ queryKey: ['gift-card-transactions'] })
    }
  })
}

// Get gift card transactions
export function useGiftCardTransactions(giftCardId?: string) {
  return useQuery({
    queryKey: ['gift-card-transactions', giftCardId],
    queryFn: async () => {
      let query = supabase
        .from('gift_card_transactions')
        .select(`
          *,
          gift_cards (code, original_amount)
        `)
        .order('created_at', { ascending: false })

      if (giftCardId) {
        query = query.eq('gift_card_id', giftCardId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[gift-card-transactions]', error)
        throw error
      }

      return data as (GiftCardTransaction & {
        gift_cards?: { code: string; original_amount: number }
      })[]
    }
  })
}

// Get gift card statistics
export function useGiftCardStatistics(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['gift-card-statistics', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('gift_cards')
        .select('status, balance, original_amount, created_at')

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[gift-card-statistics]', error)
        throw error
      }

      const stats = {
        total_cards: data.length,
        active_cards: data.filter(gc => gc.status === 'active').length,
        used_cards: data.filter(gc => gc.status === 'used').length,
        expired_cards: data.filter(gc => gc.status === 'expired').length,
        total_issued_value: data.reduce((sum, gc) => sum + gc.original_amount, 0),
        total_remaining_balance: data.reduce((sum, gc) => sum + gc.balance, 0),
        total_redeemed_value: data.reduce((sum, gc) => sum + (gc.original_amount - gc.balance), 0),
        redemption_rate: 0
      }

      if (stats.total_issued_value > 0) {
        stats.redemption_rate = (stats.total_redeemed_value / stats.total_issued_value) * 100
      }

      return stats
    }
  })
}

// Utility function to generate gift card codes
function generateGiftCardCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random1 = Math.random().toString(36).substring(2, 6).toUpperCase()
  const random2 = Math.random().toString(36).substring(2, 6).toUpperCase()
  const random3 = Math.random().toString(36).substring(2, 6).toUpperCase()
  
  return `GC-${date}-${random1}${random2}-${random3}`
}

// Export the validation function for use in PaymentModal
export const validateGiftCard = {
  mutateAsync: async (code: string) => {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('id, code, balance, original_amount, expires_at')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Gift card not found or inactive')
      }
      // If table doesn't exist, provide demo gift card for testing
      if (error.message.includes('relation "public.gift_cards" does not exist')) {
        console.warn('[gift-cards] Table not found, using demo gift card')
        // Demo gift card for testing
        if (code.toUpperCase() === 'GC-2024-ABCD1234-EFGH5678') {
          return {
            id: 'demo-gift-card',
            code: 'GC-2024-ABCD1234-EFGH5678',
            balance: 150.00,
            original_amount: 200.00,
            expires_at: null
          }
        }
      }
      throw error
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('Gift card has expired')
    }

    return {
      id: data.id,
      code: data.code,
      balance: data.balance,
      original_amount: data.original_amount,
      expires_at: data.expires_at
    }
  }
}
