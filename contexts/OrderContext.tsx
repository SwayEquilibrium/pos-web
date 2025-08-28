'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { useTableOrders, useOrderSummary } from '@/hooks/useOrders'

// ================================================
// ORDER CONTEXT - ORDER DATA MANAGEMENT
// ================================================

interface OrderContextType {
  // Data
  tableOrders: any[]
  orderSummary: any
  
  // State
  activeTableId: string | null
  activeOrderId: string | null
  
  // Loading & Error states
  isLoading: boolean
  error: any
  
  // Actions
  setActiveTable: (tableId: string) => void
  setActiveOrder: (orderId: string) => void
  clearActiveOrder: () => void
  
  // Computed values
  activeTable: any
  activeOrder: any
  hasActiveOrders: boolean
  totalAmount: number
  orderCount: number
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

// ================================================
// PROVIDER COMPONENT
// ================================================

interface OrderProviderProps {
  children: ReactNode
  initialTableId?: string
}

export function OrderProvider({ children, initialTableId }: OrderProviderProps) {
  const [activeTableId, setActiveTableId] = useState<string | null>(initialTableId || null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  
  // Fetch order data
  const { data: tableOrders, isLoading: tableOrdersLoading, error: tableOrdersError } = useTableOrders(activeTableId || '')
  const { data: orderSummary, isLoading: summaryLoading, error: summaryError } = useOrderSummary(activeOrderId || '')
  
  // Computed values
  const activeTable = activeTableId ? { id: activeTableId } : null
  const activeOrder = tableOrders.find(o => o.id === activeOrderId) || null
  
  const hasActiveOrders = tableOrders.some(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  )
  
  const totalAmount = tableOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const orderCount = tableOrders.length
  
  // Actions
  const setActiveTable = useCallback((tableId: string) => {
    setActiveTableId(tableId)
    setActiveOrderId(null)
  }, [])
  
  const setActiveOrder = useCallback((orderId: string) => {
    setActiveOrderId(orderId)
  }, [])
  
  const clearActiveOrder = useCallback(() => {
    setActiveOrderId(null)
  }, [])
  
  const value: OrderContextType = {
    // Data
    tableOrders: tableOrders || [],
    orderSummary: orderSummary || {},
    
    // State
    activeTableId,
    activeOrderId,
    
    // Loading & Error states
    isLoading: tableOrdersLoading || summaryLoading,
    error: tableOrdersError || summaryError,
    
    // Actions
    setActiveTable,
    setActiveOrder,
    clearActiveOrder,
    
    // Computed values
    activeTable,
    activeOrder,
    hasActiveOrders,
    totalAmount,
    orderCount,
  }
  
  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

// ================================================
// HOOK
// ================================================

export function useOrderContext(): OrderContextType {
  const context = useContext(OrderContext)
  
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider')
  }
  
  return context
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useActiveTable() {
  const { activeTable, activeTableId, setActiveTable } = useOrderContext()
  return { table: activeTable, tableId: activeTableId, setActiveTable }
}

export function useActiveOrder() {
  const { activeOrder, activeOrderId, setActiveOrder, clearActiveOrder } = useOrderContext()
  return { order: activeOrder, orderId: activeOrderId, setActiveOrder, clearActiveOrder }
}

export function useTableOrders() {
  const { tableOrders, hasActiveOrders, totalAmount, orderCount } = useOrderContext()
  
  const pendingOrders = tableOrders.filter(o => o.status === 'pending')
  const preparingOrders = tableOrders.filter(o => o.status === 'preparing')
  const readyOrders = tableOrders.filter(o => o.status === 'ready')
  const completedOrders = tableOrders.filter(o => o.status === 'served')
  
  return {
    all: tableOrders,
    pending: pendingOrders,
    preparing: preparingOrders,
    ready: readyOrders,
    completed: completedOrders,
    hasActiveOrders,
    totalAmount,
    orderCount,
  }
}

export function useOrderStatus() {
  const { tableOrders, hasActiveOrders } = useOrderContext()
  
  const statusCounts = tableOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const hasPendingOrders = statusCounts.pending > 0
  const hasPreparingOrders = statusCounts.preparing > 0
  const hasReadyOrders = statusCounts.ready > 0
  
  return {
    statusCounts,
    hasPendingOrders,
    hasPreparingOrders,
    hasReadyOrders,
    hasActiveOrders,
  }
}

export function useOrderSummary() {
  const { orderSummary, totalAmount, orderCount } = useOrderContext()
  
  return {
    summary: orderSummary,
    totalAmount,
    orderCount,
    // Additional computed values could go here
  }
}
