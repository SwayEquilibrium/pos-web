'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id,name,parent_id,sort_index,print_sort_index').order('sort_index')
      if (error) throw error; return data
    }
  })
}
export function useProductsByCategory(categoryId?: string) {
  return useQuery({
    queryKey: ['products', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,is_open_price,options_schema')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name')
      if (error) throw error; return data
    },
  })
}
