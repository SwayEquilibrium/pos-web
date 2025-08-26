'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Types for sales analytics
export interface CategorySales {
  category_id: string
  category_name: string
  category_path: string
  order_count: number
  items_sold: number
  total_revenue: number
  avg_item_price: number
  modifiers_revenue: number
  sale_date: string
}

export interface ProductPerformance {
  product_id: string
  product_name: string
  category_name: string
  times_ordered: number
  total_quantity_sold: number
  total_revenue: number
  avg_price: number
  total_modifier_revenue: number
  avg_modifier_per_item: number
  last_sold: string
  orders_last_30_days: number
}

export interface ModifierAnalytics {
  modifier_group_id: string
  modifier_group_name: string
  modifier_id: string
  modifier_name: string
  times_selected: number
  total_quantity: number
  total_revenue: number
  avg_price: number
  selection_percentage: number
  last_selected: string
}

export interface SalesAnalytics {
  category_name: string
  category_path: string
  product_count: number
  total_orders: number
  total_items_sold: number
  total_revenue: number
  avg_order_value: number
  top_product: string
  top_modifier: string
}

export interface HourlySalesPattern {
  hour_of_day: number
  day_of_week: number
  order_count: number
  items_sold: number
  total_revenue: number
  avg_order_value: number
}

// Get daily category sales
export function useDailyCategorySales(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['daily-category-sales', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('daily_category_sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .order('total_revenue', { ascending: false })

      if (dateRange) {
        query = query
          .gte('sale_date', dateRange.start)
          .lte('sale_date', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[daily-category-sales]', error)
        throw error
      }

      return data as CategorySales[]
    }
  })
}

// Get product performance analytics
export function useProductPerformance(limit?: number) {
  return useQuery({
    queryKey: ['product-performance', limit],
    queryFn: async () => {
      let query = supabase
        .from('product_performance')
        .select('*')
        .order('total_revenue', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('[product-performance]', error)
        throw error
      }

      return data as ProductPerformance[]
    }
  })
}

// Get modifier analytics
export function useModifierAnalytics(groupId?: string) {
  return useQuery({
    queryKey: ['modifier-analytics', groupId],
    queryFn: async () => {
      let query = supabase
        .from('modifier_analytics')
        .select('*')
        .order('times_selected', { ascending: false })

      if (groupId) {
        query = query.eq('modifier_group_id', groupId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[modifier-analytics]', error)
        throw error
      }

      return data as ModifierAnalytics[]
    }
  })
}

// Get comprehensive sales analytics using the function
export function useSalesAnalytics(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['sales-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_analytics', {
        p_start_date: dateRange?.start || null,
        p_end_date: dateRange?.end || null
      })

      if (error) {
        console.error('[sales-analytics]', error)
        throw error
      }

      return data as SalesAnalytics[]
    }
  })
}

// Get hourly sales patterns
export function useHourlySalesPattern() {
  return useQuery({
    queryKey: ['hourly-sales-pattern'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hourly_sales_pattern')
        .select('*')
        .order('day_of_week')
        .order('hour_of_day')

      if (error) {
        console.error('[hourly-sales-pattern]', error)
        throw error
      }

      return data as HourlySalesPattern[]
    }
  })
}

// Get category hierarchy sales
export function useCategoryHierarchySales() {
  return useQuery({
    queryKey: ['category-hierarchy-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_hierarchy_sales')
        .select('*')
        .order('level')
        .order('total_revenue', { ascending: false })

      if (error) {
        console.error('[category-hierarchy-sales]', error)
        throw error
      }

      return data
    }
  })
}

// Get top selling products by category
export function useTopProductsByCategory(categoryId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['top-products-by-category', categoryId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          total_price,
          orders!inner(status)
        `)
        .eq('category_id', categoryId)
        .eq('orders.status', 'paid')
        .order('total_price', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[top-products-by-category]', error)
        throw error
      }

      return data
    }
  })
}

// Get sales summary for dashboard
export function useSalesSummary(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['sales-summary', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('order_items')
        .select(`
          total_price,
          quantity,
          modifiers_total,
          created_at,
          orders!inner(status)
        `)
        .eq('orders.status', 'paid')

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('[sales-summary]', error)
        throw error
      }

      // Calculate summary statistics
      const summary = {
        total_revenue: data.reduce((sum, item) => sum + (item.total_price || 0), 0),
        total_orders: new Set(data.map(item => item.orders)).size,
        total_items: data.reduce((sum, item) => sum + (item.quantity || 0), 0),
        modifier_revenue: data.reduce((sum, item) => sum + (item.modifiers_total || 0), 0),
        avg_order_value: data.length > 0 ? data.reduce((sum, item) => sum + (item.total_price || 0), 0) / data.length : 0
      }

      return summary
    }
  })
}

// Record a new order sale
export async function recordOrderSale(orderData: {
  table_id?: string
  order_number: string
  total_amount: number
  tax_amount?: number
  discount_amount?: number
  tip_amount?: number
  payment_method: string
  customer_count?: number
  notes?: string
  status?: string
  items: Array<{
    product_id: string
    category_id: string
    quantity: number
    unit_price: number
    total_price: number
    modifiers_total: number
    special_instructions?: string
    product_name: string
    category_name: string
    modifiers?: Array<{
      modifier_group_id: string
      modifier_id: string
      modifier_name: string
      modifier_group_name: string
      price: number
      quantity: number
    }>
  }>
}) {
  const { data, error } = await supabase.rpc('record_order_sale', {
    p_order_data: orderData
  })

  if (error) {
    console.error('[record-order-sale]', error)
    throw error
  }

  return data
}
