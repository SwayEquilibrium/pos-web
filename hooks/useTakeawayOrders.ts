'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface TakeawayOrder {
  id: string
  order_number: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  pickup_time?: string
  items_count: number
  type: 'takeaway'
}

export function useTakeawayOrders() {
  return useQuery({
    queryKey: ['takeaway-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          customer_name,
          customer_phone,
          pickup_time,
          order_items!inner(
            id,
            qty,
            unit_price
          )
        `)
        .eq('type', 'takeaway')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[takeaway-orders]', error)
        return []
      }

      return (data || []).map(order => {
        const items = order.order_items || []
        const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0)
        const itemsCount = items.reduce((sum, item) => sum + item.qty, 0)
        
        // Generate order number from ID (last 4 chars) and date
        const orderDate = new Date(order.created_at)
        const dateStr = orderDate.toISOString().slice(2, 10).replace(/-/g, '')
        const orderNumber = `${dateStr}${order.id.slice(-4).toUpperCase()}`

        return {
          id: order.id,
          order_number: orderNumber,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: totalAmount,
          status: order.status as TakeawayOrder['status'],
          created_at: order.created_at,
          updated_at: order.updated_at,
          pickup_time: order.pickup_time,
          items_count: itemsCount,
          type: 'takeaway' as const
        }
      }) as TakeawayOrder[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useCreateTakeawayOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      customer_name: string
      customer_phone?: string
      pickup_time?: string
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          type: 'takeaway',
          status: 'pending',
          customer_name: params.customer_name,
          customer_phone: params.customer_phone,
          pickup_time: params.pickup_time,
          table_id: null
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeaway-orders'] })
    }
  })
}

export function useUpdateTakeawayOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      status?: TakeawayOrder['status']
      customer_name?: string
      customer_phone?: string
      pickup_time?: string
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          status: params.status,
          customer_name: params.customer_name,
          customer_phone: params.customer_phone,
          pickup_time: params.pickup_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeaway-orders'] })
    }
  })
}
