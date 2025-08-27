/**
 * Product Type Management Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

interface ProductType {
  id: string
  name: string
  code: string
  color: string
  sort_order: number
}

interface ProductTypeAssignment {
  product_id: string
  product_type_id: string
  is_primary: boolean
}

// ================================================
// PRODUCT TYPE HOOKS
// ================================================

export function useProductTypes() {
  return useQuery({
    queryKey: ['product-types'],
    queryFn: async (): Promise<ProductType[]> => {
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw new Error(`Failed to fetch product types: ${error.message}`)
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useProductTypeAssignments(productId: string) {
  return useQuery({
    queryKey: ['product-type-assignments', productId],
    queryFn: async (): Promise<ProductTypeAssignment[]> => {
      const { data, error } = await supabase
        .from('product_type_assignments')
        .select('*')
        .eq('product_id', productId)

      if (error) throw new Error(`Failed to fetch product type assignments: ${error.message}`)
      return data || []
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProductType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, productTypeId }: { productId: string; productTypeId: string }) => {
      // Remove existing assignments for this product
      await supabase
        .from('product_type_assignments')
        .delete()
        .eq('product_id', productId)

      // Add new assignment as primary
      const { error } = await supabase
        .from('product_type_assignments')
        .insert({
          product_id: productId,
          product_type_id: productTypeId,
          is_primary: true
        })

      if (error) throw new Error(`Failed to update product type: ${error.message}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-type-assignments', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] }) // Refresh product catalog
    },
  })
}

export function useCreateProductType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productType: { name: string; code: string; color?: string }) => {
      const { data, error } = await supabase
        .from('product_types')
        .insert({
          name: productType.name,
          code: productType.code.toLowerCase(),
          color: productType.color || '#6B7280',
          company_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from auth
          sort_order: 999 // Add at end
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create product type: ${error.message}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] })
    },
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export function getProductTypeName(assignments: ProductTypeAssignment[], productTypes: ProductType[]): string {
  const primaryAssignment = assignments.find(a => a.is_primary)
  if (!primaryAssignment) return 'food' // Default

  const productType = productTypes.find(pt => pt.id === primaryAssignment.product_type_id)
  return productType?.code || 'food'
}

export function getProductTypeColor(assignments: ProductTypeAssignment[], productTypes: ProductType[]): string {
  const primaryAssignment = assignments.find(a => a.is_primary)
  if (!primaryAssignment) return '#6B7280' // Default gray

  const productType = productTypes.find(pt => pt.id === primaryAssignment.product_type_id)
  return productType?.color || '#6B7280'
}
