'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      // First try with color column
      let { data, error } = await supabase.from('rooms').select('id,name,sort_index,color').order('sort_index')
      
      // If error (likely because color column doesn't exist), try without color
      if (error) {
        console.warn('[rooms] Color column not found, trying without color:', error)
        const fallbackResult = await supabase.from('rooms').select('id,name,sort_index').order('sort_index')
        if (fallbackResult.error) {
          console.error('[rooms] Fallback query failed:', fallbackResult.error)
          return [] as any[]
        }
        // Add default color to rooms that don't have it
        return (fallbackResult.data ?? []).map(room => ({ ...room, color: '#3B82F6' }))
      }
      
      return data ?? []
    }
  })
}

export function useTables() {
  return useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      // First try with all columns including coordinates
      let { data, error } = await supabase.from('tables').select('id,name,room_id,status,sort_index,capacity,x,y,width,height').order('sort_index')
      
      // If error (likely because coordinate columns don't exist), try with basic columns
      if (error) {
        console.warn('[tables] Coordinate columns not found, trying with basic columns:', error)
        const fallbackResult = await supabase.from('tables').select('id,name,room_id,status,sort_index').order('sort_index')
        if (fallbackResult.error) {
          console.error('[tables] Fallback query failed:', fallbackResult.error)
          return [] as any[]
        }
        // Add default values for missing columns
        return (fallbackResult.data ?? []).map(table => ({ 
          ...table, 
          capacity: 4,
          x: 0,
          y: 0,
          width: 60,
          height: 60
        }))
      }
      
      return data ?? []
    }
  })
}
