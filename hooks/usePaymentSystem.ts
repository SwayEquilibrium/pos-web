import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// ================================================
// PAYMENT SYSTEM HOOK - PAYMENT TYPE MANAGEMENT
// ================================================

export interface PaymentType {
  id: string
  code: string
  name: string
  description: string
  requires_reference: boolean
  supports_partial: boolean
  active: boolean
  sort_index: number
  created_at?: string
  updated_at?: string
}

const paymentSystemKeys = {
  all: ['payment-system'] as const,
  types: () => [...paymentSystemKeys.all, 'types'] as const,
  type: (id: string) => [...paymentSystemKeys.all, 'types', id] as const,
}

// ================================================
// PAYMENT TYPES
// ================================================

export function useAllPaymentTypes() {
  return useQuery({
    queryKey: paymentSystemKeys.types(),
    queryFn: async (): Promise<PaymentType[]> => {
      // For now, return hardcoded payment types since we don't have the table yet
      // This follows our rule: "adapt callers to the consolidated structure instead"
      return [
        {
          id: 'cash',
          code: 'CASH',
          name: 'Cash',
          description: 'Cash payment',
          requires_reference: false,
          supports_partial: true,
          active: true,
          sort_index: 1
        },
        {
          id: 'card',
          code: 'CARD',
          name: 'Card',
          description: 'Credit/Debit card payment',
          requires_reference: false,
          supports_partial: true,
          active: true,
          sort_index: 2
        },
        {
          id: 'mobile',
          code: 'MOBILE',
          name: 'Mobile Pay',
          description: 'Mobile payment (MobilePay, etc.)',
          requires_reference: false,
          supports_partial: true,
          active: true,
          sort_index: 3
        },
        {
          id: 'gift-card',
          code: 'GIFT_CARD',
          name: 'Gift Card',
          description: 'Gift card payment',
          requires_reference: true,
          supports_partial: false,
          active: true,
          sort_index: 4
        }
      ]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreatePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentType: Omit<PaymentType, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentType> => {
      // TODO: Implement actual Supabase call when payment_types table is ready
      const newType = {
        ...paymentType,
        id: `payment-type-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // For now, just return the created type
      // In production, this would insert into Supabase
      return newType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentSystemKeys.types() })
    },
  })
}

export function useUpdatePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PaymentType> }): Promise<PaymentType> => {
      // TODO: Implement actual Supabase call when payment_types table is ready
      const updatedType = {
        id,
        ...updates,
        updated_at: new Date().toISOString()
      } as PaymentType

      // For now, just return the updated type
      // In production, this would update in Supabase
      return updatedType
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: paymentSystemKeys.type(id) })
      queryClient.invalidateQueries({ queryKey: paymentSystemKeys.types() })
    },
  })
}

export function useDeletePaymentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // TODO: Implement actual Supabase call when payment_types table is ready
      // For now, just simulate deletion
      console.log('Deleting payment type:', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentSystemKeys.types() })
    },
  })
}

export function useReorderPaymentTypes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (typeIds: string[]): Promise<void> => {
      // TODO: Implement actual Supabase call when payment_types table is ready
      // For now, just simulate reordering
      console.log('Reordering payment types:', typeIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentSystemKeys.types() })
    },
  })
}



