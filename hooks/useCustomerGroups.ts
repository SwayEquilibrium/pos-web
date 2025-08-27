'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Types
export interface CustomerGroup {
  id: string
  name: string
  description?: string
  discount_percentage?: number
  discount_amount?: number
  color?: string
  active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CustomerGroupMember {
  id: string
  customer_group_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  member_since: string
  total_purchases?: number
  total_spent?: number
  last_purchase_at?: string
}

export interface CustomerGroupPurchase {
  id: string
  customer_group_id: string
  order_id: string
  customer_name?: string
  original_amount: number
  discount_applied: number
  final_amount: number
  created_at: string
}

// Default customer groups fallback
// No fallback data - database is the single source of truth

// Get all customer groups
export function useCustomerGroups() {
  return useQuery({
    queryKey: ['customer-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        console.error('[customer-groups] Failed to fetch customer groups:', error.message)
        throw error
      }

      return data as CustomerGroup[]
    }
  })
}

// Get customer group by ID
export function useCustomerGroup(id: string) {
  return useQuery({
    queryKey: ['customer-group', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[customer-group]', error)
        throw error
      }

      return data as CustomerGroup
    },
    enabled: !!id
  })
}

// Create customer group
export function useCreateCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (group: {
      name: string
      description?: string
      discount_percentage?: number
      discount_amount?: number
      color?: string
      created_by?: string
    }) => {
      const { data, error } = await supabase
        .from('customer_groups')
        .insert([{
          name: group.name,
          description: group.description,
          discount_percentage: group.discount_percentage || 0,
          discount_amount: group.discount_amount || 0,
          color: group.color || '#3B82F6',
          active: true,
          created_by: group.created_by
        }])
        .select()
        .single()

      if (error) {
        console.error('[create-customer-group] Failed to create customer group:', error.message)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
    }
  })
}

// Update customer group
export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: {
      id: string
      name?: string
      description?: string
      discount_percentage?: number
      discount_amount?: number
      color?: string
      active?: boolean
    }) => {
      const { id, ...updateData } = update

      const { data, error } = await supabase
        .from('customer_groups')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[update-customer-group] Failed to update customer group:', error.message)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
    }
  })
}

// Delete customer group
export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_groups')
        .update({ active: false })
        .eq('id', id)

      if (error) {
        console.error('[delete-customer-group] Failed to delete customer group:', error.message)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] })
    }
  })
}

// Get customer group purchase history with detailed transaction info
export function useCustomerGroupPurchaseHistory(groupId: string) {
  return useQuery({
    queryKey: ['customer-group-purchase-history', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_group_purchases')
        .select(`
          *,
          payment_transactions (
            id,
            payment_id,
            amount,
            payment_type_code,
            reference_number,
            processed_at,
            processed_by,
            notes
          )
        `)
        .eq('customer_group_id', groupId)
        .order('purchase_date', { ascending: false })

      if (error) {
        console.error('[customer-group-purchase-history] Failed to fetch purchase history:', error.message)
        throw error
      }

      return data || []
    },
    enabled: !!groupId
  })
}

// Get customer group analytics
export function useCustomerGroupAnalytics(groupId: string) {
  return useQuery({
    queryKey: ['customer-group-analytics', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_customer_group_analytics', { group_id: groupId })

      if (error) {
        console.error('[customer-group-analytics] Failed to fetch analytics:', error.message)
        throw error
      }

      return data
    },
    enabled: !!groupId
  })
}

// Get customer group members
export function useCustomerGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['customer-group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_group_members')
        .select('*')
        .eq('customer_group_id', groupId)
        .order('member_since', { ascending: false })

      if (error) {
        console.error('[customer-group-members]', error)
        throw error
      }

      return data as CustomerGroupMember[]
    },
    enabled: !!groupId
  })
}

// Add member to customer group
export function useAddCustomerGroupMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (member: {
      customer_group_id: string
      customer_name: string
      customer_email?: string
      customer_phone?: string
    }) => {
      const { data, error } = await supabase
        .from('customer_group_members')
        .insert([{
          ...member,
          member_since: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('[add-customer-group-member]', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['customer-group-members', variables.customer_group_id] 
      })
    }
  })
}

// Get customer group purchases (for analytics)
export function useCustomerGroupPurchases(groupId?: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['customer-group-purchases', groupId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('customer_group_purchases')
        .select('*')
        .order('created_at', { ascending: false })

      if (groupId) {
        query = query.eq('customer_group_id', groupId)
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[customer-group-purchases]', error)
        throw error
      }

      return data as CustomerGroupPurchase[]
    }
  })
}

// Record customer group purchase (called when payment is processed)
export function useRecordCustomerGroupPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (purchase: {
      customer_group_id: string
      order_id: string
      customer_name?: string
      original_amount: number
      discount_applied: number
      final_amount: number
    }) => {
      // Try the new table first
      let data, error
      
      const insertData = {
        ...purchase,
        created_at: new Date().toISOString()
      }

      // Try customer_group_purchase_history first (new table)
      const { data: historyData, error: historyError } = await supabase
        .from('customer_group_purchase_history')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('[record-customer-group-purchase] Failed to record purchase:', error.message)
        throw error
      }

      // Update member statistics
      if (purchase.customer_name) {
        const { error: memberError } = await supabase.rpc('update_customer_member_stats', {
          p_customer_group_id: purchase.customer_group_id,
          p_customer_name: purchase.customer_name,
          p_purchase_amount: purchase.final_amount
        })

        if (memberError) {
          console.error('[update-member-stats]', memberError)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-group-purchases'] })
      queryClient.invalidateQueries({ queryKey: ['customer-group-members'] })
    }
  })
}

// Get customer group statistics
export function useCustomerGroupStatistics(groupId?: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['customer-group-statistics', groupId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('customer_group_purchases')
        .select('customer_group_id, original_amount, discount_applied, final_amount, created_at')

      if (groupId) {
        query = query.eq('customer_group_id', groupId)
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[customer-group-statistics]', error)
        throw error
      }

      const stats = {
        total_purchases: data.length,
        total_original_amount: data.reduce((sum, p) => sum + p.original_amount, 0),
        total_discount_given: data.reduce((sum, p) => sum + p.discount_applied, 0),
        total_final_amount: data.reduce((sum, p) => sum + p.final_amount, 0),
        average_purchase_amount: data.length > 0 ? data.reduce((sum, p) => sum + p.final_amount, 0) / data.length : 0,
        average_discount_per_purchase: data.length > 0 ? data.reduce((sum, p) => sum + p.discount_applied, 0) / data.length : 0,
        discount_percentage: 0
      }

      if (stats.total_original_amount > 0) {
        stats.discount_percentage = (stats.total_discount_given / stats.total_original_amount) * 100
      }

      return stats
    }
  })
}
