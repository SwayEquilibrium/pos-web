'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface TableOrder {
  id: string
  order_number: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  total_amount: number
  items_count: number
  created_at: string
  updated_at: string
  customer_name?: string
  type: 'dine_in'
  table_id: string
  order_items: {
    id: string
    qty: number
    unit_price: number
    product_name: string
    category_name: string
    modifiers_total: number
  }[]
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: ['table-orders', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          customer_name,
          type,
          table_id,
          created_at,
          updated_at,
          order_items(
            id,
            qty,
            unit_price,
            product_name,
            category_name,
            modifiers_total
          )
        `)
        .eq('table_id', tableId)
        .eq('type', 'dine_in')
        .neq('status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[table-orders]', error)
        return []
      }

      return (data || []).map(order => {
        const items = order.order_items || []
        const totalAmount = items.reduce((sum, item) => {
          const itemTotal = (item.unit_price * item.qty)
          const modifiersTotal = item.modifiers_total || 0
          return sum + itemTotal + modifiersTotal
        }, 0)

        return {
          id: order.id,
          order_number: order.order_number || `T${tableId.slice(-4)}-${new Date(order.created_at).getTime().toString().slice(-6)}`,
          status: order.status,
          total_amount: totalAmount,
          items_count: items.reduce((sum, item) => sum + item.qty, 0),
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_name: order.customer_name,
          type: 'dine_in' as const,
          table_id: order.table_id,
          order_items: items
        } as TableOrder
      })
    },
    enabled: !!tableId,
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

export function useAllTableOrders() {
  return useQuery({
    queryKey: ['all-table-orders'],
    queryFn: async () => {
      try {
        // Following our rules: adapt to current schema instead of fighting it
        // Check if orders table exists first
        const { error: tableCheckError } = await supabase
          .from('orders')
          .select('id')
          .limit(1)
        
        if (tableCheckError) {
          // Orders table doesn't exist yet - return empty array gracefully
          console.log('[all-table-orders] Orders table not ready yet, returning empty data')
          return []
        }

        // If table exists, proceed with normal query
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            total_amount,
            customer_name,
            type,
            table_id,
            created_at,
            updated_at,
            tables!inner(
              name,
              rooms!inner(name)
            ),
            order_items(
              id,
              qty,
              unit_price,
              product_name,
              category_name,
              modifiers_total
            )
          `)
          .eq('type', 'dine_in')
          .neq('status', 'paid')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true })

        if (error) {
          console.error('[all-table-orders] Query error:', error)
          return []
        }

        return (data || []).map(order => {
          const items = order.order_items || []
          const totalAmount = items.reduce((sum, item) => {
            const itemTotal = (item.unit_price * item.qty)
            const modifiersTotal = item.modifiers_total || 0
            return sum + itemTotal + modifiersTotal
          }, 0)

          return {
            id: order.id,
            order_number: order.order_number || `T${order.table_id.slice(-6)}-${new Date(order.created_at).getTime().toString().slice(-6)}`,
            status: order.status,
            total_amount: totalAmount,
            items_count: items.reduce((sum, item) => sum + item.qty, 0),
            created_at: order.created_at,
            updated_at: order.updated_at,
            customer_name: order.customer_name,
            type: 'dine_in' as const,
            table_id: order.table_id,
            table_name: order.tables?.name,
            room_name: order.tables?.rooms?.name,
            order_items: items
          }
        })
      } catch (err) {
        // Following our rules: handle errors gracefully, don't crash
        console.log('[all-table-orders] Orders system not ready yet:', err instanceof Error ? err.message : 'Unknown error')
        return []
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}
