'use client'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type NewOrderItem = {
  product_id: string
  qty: number
  unit_price?: number
  kitchen_note?: string
  sort_bucket?: number
  course_no?: number
  added_at?: number // Timestamp for preventing duplicates
  modifiers?: { 
    modifier_id: string
    modifier_name: string
    price_adjustment: number
  }[]
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (params: { type: 'dine_in'|'takeaway', table_id?: string|null, pin_required?: boolean, items: NewOrderItem[] }) => {
      console.log('Creating order with params:', params)
      
      const payload = {
        p_type: params.type,
        p_table_id: params.table_id ?? null,
        p_pin_required: params.pin_required ?? false,
        p_items: params.items.map(i => ({
          product_id: i.product_id,
          qty: i.qty,
          unit_price: i.unit_price,
          kitchen_note: i.kitchen_note,
          sort_bucket: i.sort_bucket ?? 0,
          course_no: i.course_no ?? 1,
          modifiers: i.modifiers ?? []
        }))
      }
      
      console.log('RPC payload:', payload)
      
      const { data, error } = await supabase.rpc('create_order', payload)
      
      console.log('RPC response - data:', data, 'error:', error)
      
      if (error) {
        console.error('Supabase RPC error:', error)
        throw new Error(`Database error: ${error.message || 'Unknown error'}`)
      }
      
      return data as string // order_id
    }
  })
}

export function useFireCourse() {
  return useMutation({
    mutationFn: async (args: { order_id: string, course_no: number }) => {
      const { error } = await supabase.rpc('fire_course', { p_order: args.order_id, p_course: args.course_no })
      if (error) throw error
      return true
    }
  })
}

export function useFireNextCourse() {
  return useMutation({
    mutationFn: async (order_id: string) => {
      const { data, error } = await supabase.rpc('fire_next_course', { p_order: order_id })
      if (error) throw error
      return data as number | null
    }
  })
}
