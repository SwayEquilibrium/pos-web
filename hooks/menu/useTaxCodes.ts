// ================================================
// TAX CODES HOOKS
// React Query hooks for tax code operations
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as pricingRepo from '@/lib/repos/menu.repo'
import type { TaxCode } from '@/lib/types/menu'

// ================================================
// QUERY KEYS
// ================================================

export const taxCodeKeys = {
  all: ['tax-codes'] as const,
  detail: (id: string) => ['tax-codes', 'detail', id] as const
}

// ================================================
// QUERIES
// ================================================

export function useTaxCodes() {
  return useQuery({
    queryKey: taxCodeKeys.all,
    queryFn: pricingRepo.getTaxCodes,
    staleTime: 10 * 60 * 1000, // 10 minutes (tax codes don't change often)
    cacheTime: 30 * 60 * 1000 // 30 minutes
  })
}

export function useTaxCode(id?: string | null) {
  return useQuery({
    queryKey: taxCodeKeys.detail(id || ''),
    queryFn: () => id ? pricingRepo.getTaxCode(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000
  })
}

// ================================================
// MUTATIONS
// ================================================

export function useCreateTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pricingRepo.createTaxCode,
    onSuccess: (newTaxCode) => {
      // Invalidate tax code queries
      queryClient.invalidateQueries({ queryKey: taxCodeKeys.all })

      toast.success('Tax code created successfully')
    },
    onError: (error) => {
      console.error('Error creating tax code:', error)
      toast.error('Failed to create tax code')
    }
  })
}

export function useUpdateTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; rate?: number } }) =>
      pricingRepo.updateTaxCode(id, updates),
    onSuccess: (updatedTaxCode) => {
      // Invalidate tax code queries
      queryClient.invalidateQueries({ queryKey: taxCodeKeys.all })
      
      // Update the specific tax code in cache
      queryClient.setQueryData(
        taxCodeKeys.detail(updatedTaxCode.id),
        updatedTaxCode
      )

      toast.success('Tax code updated successfully')
    },
    onError: (error) => {
      console.error('Error updating tax code:', error)
      toast.error('Failed to update tax code')
    }
  })
}

export function useDeleteTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pricingRepo.deleteTaxCode,
    onSuccess: () => {
      // Invalidate all tax code queries
      queryClient.invalidateQueries({ queryKey: taxCodeKeys.all })
      
      toast.success('Tax code deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting tax code:', error)
      toast.error('Failed to delete tax code')
    }
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Get tax codes formatted for select dropdowns
 */
export function useTaxCodeOptions() {
  const { data: taxCodes = [], isLoading, error } = useTaxCodes()

  const options = taxCodes.map(taxCode => ({
    value: taxCode.id,
    label: `${taxCode.name} (${taxCode.rate}%)`,
    rate: taxCode.rate
  }))

  return {
    options,
    isLoading,
    error
  }
}

/**
 * Calculate tax amount based on price and tax code
 */
export function useCalculateTax() {
  const { data: taxCodes = [] } = useTaxCodes()

  const calculateTax = (price: number, taxCodeId?: string | null): number => {
    if (!taxCodeId || !price) return 0
    
    const taxCode = taxCodes.find(tc => tc.id === taxCodeId)
    if (!taxCode) return 0

    return (price * taxCode.rate) / 100
  }

  const calculateTotalWithTax = (price: number, taxCodeId?: string | null): number => {
    return price + calculateTax(price, taxCodeId)
  }

  const calculatePriceExcludingTax = (totalPrice: number, taxCodeId?: string | null): number => {
    if (!taxCodeId || !totalPrice) return totalPrice
    
    const taxCode = taxCodes.find(tc => tc.id === taxCodeId)
    if (!taxCode) return totalPrice

    return totalPrice / (1 + taxCode.rate / 100)
  }

  return {
    calculateTax,
    calculateTotalWithTax,
    calculatePriceExcludingTax,
    taxCodes
  }
}

/**
 * Get the default tax code (usually the first one or most commonly used)
 */
export function useDefaultTaxCode() {
  const { data: taxCodes = [] } = useTaxCodes()

  // Return the first tax code as default, or null if none exist
  const defaultTaxCode = taxCodes.length > 0 ? taxCodes[0] : null

  return {
    defaultTaxCode,
    defaultTaxCodeId: defaultTaxCode?.id || null
  }
}
