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
const DEFAULT_CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    id: 'vip-default',
    name: 'VIP Customers',
    description: 'Premium customers with 10% discount',
    discount_percentage: 10.0,
    discount_amount: 0,
    color: '#FFD700',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'staff-default',
    name: 'Staff Discount',
    description: 'Employee discount group',
    discount_percentage: 15.0,
    discount_amount: 0,
    color: '#32CD32',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'business-default',
    name: 'Business Partners',
    description: 'Partner companies discount',
    discount_percentage: 5.0,
    discount_amount: 0,
    color: '#4169E1',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

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
        console.warn('[customer-groups] Database table not found, using defaults:', error.message)
        // Return default customer groups if table doesn't exist
        return DEFAULT_CUSTOMER_GROUPS
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
        // Check if it's a missing table error (database not set up)
        if (error.message?.includes('relation "public.customer_groups" does not exist')) {
          console.warn('[create-customer-group] Database table not found, using demo mode')
          
          // Return mock customer group for demo
          const mockGroup = {
            id: `demo-group-${Date.now()}`,
            name: group.name,
            description: group.description || '',
            discount_percentage: group.discount_percentage || 0,
            discount_amount: group.discount_amount || 0,
            color: group.color || '#3B82F6',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.info('[create-customer-group] Group created (demo mode):', mockGroup)
          return mockGroup
        }
        
        console.error('[create-customer-group]', error)
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
        // Check if it's a missing table error (database not set up)
        if (error.message?.includes('relation "public.customer_groups" does not exist')) {
          console.warn('[update-customer-group] Database table not found, using demo mode')
          
          // Return mock updated group for demo
          const mockUpdatedGroup = {
            id,
            ...updateData,
            updated_at: new Date().toISOString()
          }
          
          console.info('[update-customer-group] Group updated (demo mode):', mockUpdatedGroup)
          return mockUpdatedGroup
        }
        
        console.error('[update-customer-group]', error)
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
        // Check if it's a missing table error (database not set up)
        if (error.message?.includes('relation "public.customer_groups" does not exist')) {
          console.warn('[delete-customer-group] Database table not found, using demo mode')
          console.info('[delete-customer-group] Group deleted (demo mode):', id)
          return id
        }
        
        console.error('[delete-customer-group]', error)
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
        // Check if it's a missing table error (database not set up)
        if (error.message?.includes('relation "public.customer_group_purchases" does not exist')) {
          console.warn('[customer-group-purchase-history] Database table not found, using demo data')
          
          // Return mock purchase history for demo
          const mockPurchases = [
            {
              id: 'demo-purchase-1',
              customer_group_id: groupId,
              order_id: 'ORDER-20241201-001',
              total_amount: 450.00,
              discount_applied: 45.00,
              purchase_date: '2024-12-01T18:30:00Z',
              customer_name: 'John Doe',
              items_count: 3,
              payment_transactions: [{
                id: 'demo-payment-1',
                payment_id: 'PAY-20241201-0001',
                amount: 405.00,
                payment_type_code: 'CARD',
                reference_number: 'REF123456',
                processed_at: '2024-12-01T18:32:00Z',
                processed_by: 'staff-user',
                notes: 'VIP customer discount applied'
              }]
            },
            {
              id: 'demo-purchase-2',
              customer_group_id: groupId,
              order_id: 'ORDER-20241130-045',
              total_amount: 280.00,
              discount_applied: 28.00,
              purchase_date: '2024-11-30T20:15:00Z',
              customer_name: 'Jane Smith',
              items_count: 2,
              payment_transactions: [{
                id: 'demo-payment-2',
                payment_id: 'PAY-20241130-0045',
                amount: 252.00,
                payment_type_code: 'CASH',
                reference_number: null,
                processed_at: '2024-11-30T20:17:00Z',
                processed_by: 'staff-user',
                notes: 'Cash payment with VIP discount'
              }]
            },
            {
              id: 'demo-purchase-3',
              customer_group_id: groupId,
              order_id: 'ORDER-20241129-023',
              total_amount: 650.00,
              discount_applied: 65.00,
              purchase_date: '2024-11-29T19:45:00Z',
              customer_name: 'Mike Johnson',
              items_count: 4,
              payment_transactions: [{
                id: 'demo-payment-3',
                payment_id: 'PAY-20241129-0023',
                amount: 585.00,
                payment_type_code: 'MOBILE_PAY',
                reference_number: 'MP789012',
                processed_at: '2024-11-29T19:47:00Z',
                processed_by: 'staff-user',
                notes: 'MobilePay with group discount'
              }]
            }
          ]
          
          return mockPurchases
        }
        
        console.error('[customer-group-purchase-history]', error)
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
        // Check if it's a missing function error (database not set up)
        if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.warn('[customer-group-analytics] Database function not found, using demo data')
          
          // Return mock analytics for demo
          const mockAnalytics = {
            total_purchases: 15,
            total_spent: 4250.00,
            total_discount_given: 425.00,
            average_order_value: 283.33,
            last_purchase_date: '2024-12-01T18:30:00Z',
            most_frequent_payment_method: 'CARD',
            monthly_spending: [
              { month: '2024-12', amount: 1380.00, orders: 5 },
              { month: '2024-11', amount: 1650.00, orders: 6 },
              { month: '2024-10', amount: 1220.00, orders: 4 }
            ]
          }
          
          return mockAnalytics
        }
        
        console.error('[customer-group-analytics]', error)
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

      if (!historyError) {
        data = historyData
        error = null
      } else {
        // Fallback to old table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('customer_group_purchases')
          .insert([insertData])
          .select()
          .single()
        
        data = fallbackData
        error = fallbackError
      }

      if (error) {
        console.warn('[record-customer-group-purchase] Both tables failed:', error)
        // Don't throw error - just log and continue
        return null
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
