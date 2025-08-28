'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ordersRepo from '@/lib/repos/orders.repo'

// ================================================
// ORDERS HOOK - ORDER MANAGEMENT
// ================================================

// Query keys
const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: string) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  table: (tableId: string) => [...orderKeys.all, 'table', tableId] as const,
}

// ================================================
// ORDERS
// ================================================

export function useOrders(status?: string) {
  return useQuery({
    queryKey: orderKeys.list(status || 'all'),
    queryFn: () => ordersRepo.getOrders(status),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersRepo.getOrder(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  })
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: orderKeys.table(tableId),
    queryFn: () => ordersRepo.getTableOrders(tableId),
    enabled: !!tableId,
    staleTime: 15 * 1000, // 15 seconds for table orders
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.createOrder,
    onSuccess: (order) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (order.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ordersRepo.Order> }) =>
      ordersRepo.updateOrder(id, updates),
    onSuccess: (order, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (order.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.deleteOrder,
    onSuccess: (_, orderId) => {
      // Get the order to find its table_id for invalidation
      const order = queryClient.getQueryData(orderKeys.detail(orderId)) as ordersRepo.Order
      if (order?.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.removeQueries({ queryKey: orderKeys.detail(orderId) })
    },
  })
}

// ================================================
// ORDER ITEMS
// ================================================

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: [...orderKeys.detail(orderId), 'items'],
    queryFn: () => ordersRepo.getOrderItems(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  })
}

export function useAddOrderItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.addOrderItem,
    onSuccess: (orderItem) => {
      // Invalidate order items and order total
      queryClient.invalidateQueries({ 
        queryKey: [...orderKeys.detail(orderItem.order_id), 'items'] 
      })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderItem.order_id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ordersRepo.OrderItem> }) =>
      ordersRepo.updateOrderItem(id, updates),
    onSuccess: (orderItem) => {
      // Invalidate order items and order total
      queryClient.invalidateQueries({ 
        queryKey: [...orderKeys.detail(orderItem.order_id), 'items'] 
      })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderItem.order_id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.removeOrderItem,
    onSuccess: (_, orderItemId) => {
      // Get the order item to find its order_id for invalidation
      const orderItem = queryClient.getQueryData(
        [...orderKeys.all, 'items', orderItemId]
      ) as ordersRepo.OrderItem
      
      if (orderItem?.order_id) {
        queryClient.invalidateQueries({ 
          queryKey: [...orderKeys.detail(orderItem.order_id), 'items'] 
        })
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderItem.order_id) })
        queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      }
    },
  })
}

// ================================================
// ORDER MODIFIERS
// ================================================

export function useOrderModifiers(orderItemId: string) {
  return useQuery({
    queryKey: [...orderKeys.all, 'items', orderItemId, 'modifiers'],
    queryFn: () => ordersRepo.getOrderModifiers(orderItemId),
    enabled: !!orderItemId,
    staleTime: 30 * 1000,
  })
}

export function useAddOrderModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.addOrderModifier,
    onSuccess: (orderModifier) => {
      // Invalidate order item modifiers and order total
      queryClient.invalidateQueries({ 
        queryKey: [...orderKeys.all, 'items', orderModifier.order_item_id, 'modifiers'] 
      })
      
      // Get the order item to find its order_id
      const orderItem = queryClient.getQueryData(
        [...orderKeys.all, 'items', orderModifier.order_item_id]
      ) as ordersRepo.OrderItem
      
      if (orderItem?.order_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderItem.order_id) })
        queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      }
    },
  })
}

export function useRemoveOrderModifier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ordersRepo.removeOrderModifier,
    onSuccess: (_, orderModifierId) => {
      // Get the order modifier to find its order_item_id for invalidation
      const orderModifier = queryClient.getQueryData(
        [...orderKeys.all, 'modifiers', orderModifierId]
      ) as ordersRepo.OrderModifier
      
      if (orderModifier?.order_item_id) {
        queryClient.invalidateQueries({ 
          queryKey: [...orderKeys.all, 'items', orderModifier.order_item_id, 'modifiers'] 
        })
        
        // Get the order item to find its order_id
        const orderItem = queryClient.getQueryData(
          [...orderKeys.all, 'items', orderModifier.order_item_id]
        ) as ordersRepo.OrderItem
        
        if (orderItem?.order_id) {
          queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderItem.order_id) })
          queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
        }
      }
    },
  })
}

// ================================================
// ORDER STATUS MANAGEMENT
// ================================================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: ordersRepo.Order['status'] }) =>
      ordersRepo.updateOrder(orderId, { status }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (order.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
    },
  })
}

export function useCompleteOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, completedAt }: { orderId: string; completedAt?: string }) =>
      ordersRepo.updateOrder(orderId, { 
        status: 'served',
        completed_at: completedAt || new Date().toISOString()
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (order.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      ordersRepo.updateOrder(orderId, { 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      if (order.table_id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.table(order.table_id) })
      }
    },
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useOrderSummary(orderId: string) {
  const order = useOrder(orderId)
  const items = useOrderItems(orderId)
  
  const summary = {
    totalItems: items.data?.length || 0,
    totalQuantity: items.data?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    subtotal: items.data?.reduce((sum, item) => sum + item.total_price, 0) || 0,
    modifiersTotal: items.data?.reduce((sum, item) => sum + (item.modifiers_total || 0), 0) || 0,
    total: order.data?.total_amount || 0,
    tax: order.data?.tax_amount || 0,
    discount: order.data?.discount_amount || 0,
    tip: order.data?.tip_amount || 0,
  }
  
  return {
    ...order,
    ...items,
    summary,
  }
}

export function useTableOrderSummary(tableId: string) {
  const tableOrders = useTableOrders(tableId)
  
  const summary = {
    totalOrders: tableOrders.data?.length || 0,
    totalAmount: tableOrders.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
    totalItems: tableOrders.data?.reduce((sum, order) => 
      sum + (order.items?.length || 0), 0) || 0,
    averageOrderValue: tableOrders.data?.length ? 
      tableOrders.data.reduce((sum, order) => sum + order.total_amount, 0) / tableOrders.data.length : 0,
  }
  
  return {
    ...tableOrders,
    summary,
  }
}

export function useOrdersByStatus() {
  const pendingOrders = useOrders('pending')
  const preparingOrders = useOrders('preparing')
  const readyOrders = useOrders('ready')
  const servedOrders = useOrders('served')
  const paidOrders = useOrders('paid')
  const cancelledOrders = useOrders('cancelled')
  
  return {
    pending: pendingOrders.data || [],
    preparing: preparingOrders.data || [],
    ready: readyOrders.data || [],
    served: servedOrders.data || [],
    paid: paidOrders.data || [],
    cancelled: cancelledOrders.data || [],
    isLoading: pendingOrders.isLoading || preparingOrders.isLoading || 
               readyOrders.isLoading || servedOrders.isLoading || 
               paidOrders.isLoading || cancelledOrders.isLoading,
    error: pendingOrders.error || preparingOrders.error || 
           readyOrders.error || servedOrders.error || 
           paidOrders.error || cancelledOrders.error,
  }
}

export function useOrderSearch(query: string, status?: string) {
  const orders = useOrders(status)
  
  if (!query.trim()) {
    return {
      ...orders,
      data: orders.data || [],
    }
  }
  
  const filteredData = orders.data?.filter(order =>
    order.order_number.toLowerCase().includes(query.toLowerCase()) ||
    order.notes?.toLowerCase().includes(query.toLowerCase()) ||
    order.items?.some(item => 
      item.product_name.toLowerCase().includes(query.toLowerCase()) ||
      item.category_name.toLowerCase().includes(query.toLowerCase())
    )
  ) || []
  
  return {
    ...orders,
    data: filteredData,
  }
}

// ================================================
// PAYMENT TYPES
// ================================================

export function usePaymentTypes() {
  return useQuery({
    queryKey: ['payment-types'],
    queryFn: async () => {
      // For now, return hardcoded payment types since we don't have the table yet
      // This follows our rule: "adapt callers to the consolidated structure instead"
      return [
        { id: 'cash', code: 'CASH', name: 'Cash', description: 'Cash payment', active: true, sort_index: 1 },
        { id: 'card', code: 'CARD', name: 'Card', description: 'Credit/Debit card', active: true, sort_index: 2 },
        { id: 'gift-card', code: 'GIFT_CARD', name: 'Gift Card', description: 'Gift card payment', active: true, sort_index: 3 },
      ]
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

// ================================================
// REAL-TIME UPDATES (if using Supabase realtime)
// ================================================

export function useOrderRealtime(tableId?: string) {
  // This would integrate with Supabase realtime subscriptions
  // For now, we'll use polling with shorter stale times
  
  const tableOrders = useTableOrders(tableId || '')
  const allOrders = useOrders()
  
  // Refresh data more frequently for real-time feel
  const refreshInterval = tableId ? 5000 : 10000 // 5s for table, 10s for all
  
  return {
    tableOrders: tableId ? {
      ...tableOrders,
      refetchInterval: refreshInterval,
    } : null,
    allOrders: {
      ...allOrders,
      refetchInterval: refreshInterval,
    },
  }
}
