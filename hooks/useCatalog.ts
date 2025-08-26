'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,parent_id,sort_index,print_sort_index,color,emoji,display_style,image_url,image_thumbnail_url')
        .order('sort_index')
      if (error) { console.error('[categories]', error); return [] as any[] }
      return data ?? []
    }
  })
}

// Get subcategories for hierarchical navigation
export function useSubcategories(parentId?: string | null) {
  return useQuery({
    queryKey: ['subcategories', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_subcategories', { p_parent_category_id: parentId || null })
      
      if (error) {
        console.error('[subcategories]', error)
        return [] as any[]
      }
      
      return data ?? []
    }
  })
}

// Get category breadcrumbs for navigation
export function useCategoryBreadcrumbs(categoryId?: string) {
  return useQuery({
    queryKey: ['category-breadcrumbs', categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_category_breadcrumbs', { p_category_id: categoryId })
      
      if (error) {
        console.error('[category-breadcrumbs]', error)
        return [] as any[]
      }
      
      return data ?? []
    }
  })
}

// Get root categories (top level)
export function useRootCategories() {
  return useQuery({
    queryKey: ['root-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_root_categories')
      
      if (error) {
        console.error('[root-categories]', error)
        return [] as any[]
      }
      
      return data ?? []
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
        .select('id,name,description,price,is_open_price,options_schema,color,emoji,display_style,image_url,image_thumbnail_url')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name')
      if (error) { console.error('[products]', error); return [] as any[] }
      return data ?? []
    },
  })
}
