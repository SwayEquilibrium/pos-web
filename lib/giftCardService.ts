import { supabase } from './supabaseClient'

export interface GiftCard {
  id: string
  company_id: string
  code: string
  initial_amount: number
  current_balance: number
  status: 'active' | 'used' | 'expired' | 'cancelled'
  recipient_name?: string
  recipient_email?: string
  sender_name?: string
  sender_email?: string
  message?: string
  issued_date: string
  expiry_date?: string
  used_date?: string
  created_at: string
  updated_at: string
}

export interface GiftCardTransaction {
  id: string
  gift_card_id: string
  transaction_type: 'issue' | 'redeem' | 'refund' | 'expire'
  amount: number
  balance_before: number
  balance_after: number
  order_id?: string
  notes?: string
  created_at: string
  created_by?: string
}

export interface CreateGiftCardParams {
  amount: number
  recipient_name?: string
  recipient_email?: string
  sender_name?: string
  sender_email?: string
  message?: string
  expiry_months?: number
}

export interface RedeemGiftCardParams {
  code: string
  amount: number
  order_id?: string
}

export interface GiftCardBalance {
  found: boolean
  current_balance: number
  status: string
  expiry_date?: string
  recipient_name?: string
}

class GiftCardService {
  /**
   * Create a new gift card
   */
  async createGiftCard(companyId: string, params: CreateGiftCardParams) {
    try {
      const { data, error } = await supabase.rpc('create_gift_card', {
        p_company_id: companyId,
        p_amount: params.amount,
        p_recipient_name: params.recipient_name || null,
        p_recipient_email: params.recipient_email || null,
        p_sender_name: params.sender_name || null,
        p_sender_email: params.sender_email || null,
        p_message: params.message || null,
        p_expiry_months: params.expiry_months || 12
      })

      if (error) {
        console.error('Error creating gift card:', error)
        throw new Error(error.message)
      }

      return data[0] // Returns { gift_card_id, gift_card_code, initial_amount, expiry_date }
    } catch (error) {
      console.error('Error in createGiftCard:', error)
      throw error
    }
  }

  /**
   * Get all gift cards for a company
   */
  async getGiftCards(companyId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('gift_cards')
        .select(`
          *,
          gift_card_transactions(
            id,
            transaction_type,
            amount,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

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
        console.error('Error fetching gift cards:', error)
        throw new Error(error.message)
      }

      return data as (GiftCard & { gift_card_transactions: GiftCardTransaction[] })[]
    } catch (error) {
      console.error('Error in getGiftCards:', error)
      throw error
    }
  }

  /**
   * Get gift card by code
   */
  async getGiftCardByCode(code: string) {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          gift_card_transactions(
            id,
            transaction_type,
            amount,
            balance_before,
            balance_after,
            created_at,
            notes
          )
        `)
        .eq('code', code.toUpperCase())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Gift card not found
        }
        console.error('Error fetching gift card:', error)
        throw new Error(error.message)
      }

      return data as GiftCard & { gift_card_transactions: GiftCardTransaction[] }
    } catch (error) {
      console.error('Error in getGiftCardByCode:', error)
      throw error
    }
  }

  /**
   * Check gift card balance
   */
  async checkBalance(code: string): Promise<GiftCardBalance> {
    try {
      const { data, error } = await supabase.rpc('check_gift_card_balance', {
        p_code: code.toUpperCase()
      })

      if (error) {
        console.error('Error checking gift card balance:', error)
        throw new Error(error.message)
      }

      return data[0] as GiftCardBalance
    } catch (error) {
      console.error('Error in checkBalance:', error)
      throw error
    }
  }

  /**
   * Redeem gift card
   */
  async redeemGiftCard(params: RedeemGiftCardParams) {
    try {
      const { data, error } = await supabase.rpc('redeem_gift_card', {
        p_code: params.code.toUpperCase(),
        p_amount: params.amount,
        p_order_id: params.order_id || null
      })

      if (error) {
        console.error('Error redeeming gift card:', error)
        throw new Error(error.message)
      }

      return data[0] // Returns { success, message, remaining_balance }
    } catch (error) {
      console.error('Error in redeemGiftCard:', error)
      throw error
    }
  }

  /**
   * Cancel gift card
   */
  async cancelGiftCard(giftCardId: string, reason?: string) {
    try {
      const { data: giftCard, error: fetchError } = await supabase
        .from('gift_cards')
        .select('current_balance')
        .eq('id', giftCardId)
        .single()

      if (fetchError) throw fetchError

      // Update gift card status to cancelled
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', giftCardId)

      if (updateError) throw updateError

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: giftCardId,
          transaction_type: 'expire',
          amount: 0,
          balance_before: giftCard.current_balance,
          balance_after: giftCard.current_balance,
          notes: reason || 'Gift card cancelled'
        })

      if (transactionError) throw transactionError

      return { success: true, message: 'Gift card cancelled successfully' }
    } catch (error) {
      console.error('Error in cancelGiftCard:', error)
      throw error
    }
  }

  /**
   * Get gift card statistics
   */
  async getGiftCardStats(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('status, initial_amount, current_balance')
        .eq('company_id', companyId)

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(gc => gc.status === 'active').length,
        used: data.filter(gc => gc.status === 'used').length,
        expired: data.filter(gc => gc.status === 'expired').length,
        cancelled: data.filter(gc => gc.status === 'cancelled').length,
        totalIssued: data.reduce((sum, gc) => sum + gc.initial_amount, 0),
        totalRedeemed: data.reduce((sum, gc) => sum + (gc.initial_amount - gc.current_balance), 0),
        totalOutstanding: data.reduce((sum, gc) => sum + gc.current_balance, 0)
      }

      return stats
    } catch (error) {
      console.error('Error in getGiftCardStats:', error)
      throw error
    }
  }

  /**
   * Get gift card transactions
   */
  async getTransactions(giftCardId: string) {
    try {
      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select('*')
        .eq('gift_card_id', giftCardId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as GiftCardTransaction[]
    } catch (error) {
      console.error('Error in getTransactions:', error)
      throw error
    }
  }

  /**
   * Search gift cards
   */
  async searchGiftCards(companyId: string, searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('company_id', companyId)
        .or(`code.ilike.%${searchTerm}%,recipient_name.ilike.%${searchTerm}%,recipient_email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return data as GiftCard[]
    } catch (error) {
      console.error('Error in searchGiftCards:', error)
      throw error
    }
  }
}

export const giftCardService = new GiftCardService()
