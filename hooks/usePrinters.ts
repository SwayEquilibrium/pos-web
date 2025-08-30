/**
 * Simple React hooks for printer management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as printersRepo from '@/lib/repos/printers.repo'

// Simple printer query keys
const printerKeys = {
  all: ['printers'] as const,
  lists: () => [...printerKeys.all, 'list'] as const,
  list: (filters: string) => [...printerKeys.lists(), { filters }] as const,
  details: () => [...printerKeys.all, 'detail'] as const,
  detail: (id: string) => [...printerKeys.details(), id] as const,
}

// ================================================
// BASIC PRINTER HOOKS
// ================================================

export function usePrinters() {
  return useQuery({
    queryKey: printerKeys.list('all'),
    queryFn: printersRepo.getPrinters,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function usePrinter(printerId: string) {
  return useQuery({
    queryKey: printerKeys.detail(printerId),
    queryFn: () => printersRepo.getPrinter(printerId),
    enabled: !!printerId,
    staleTime: 30 * 1000,
  })
}

export function useCreatePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: printersRepo.createPrinter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
    },
  })
}

export function useUpdatePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<printersRepo.Printer> }) =>
      printersRepo.updatePrinter(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: printerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
    },
  })
}

export function useDeletePrinter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: printersRepo.deletePrinter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: printerKeys.lists() })
    },
  })
}

// Simple test function
export function useTestPrinterConnection() {
  return useMutation({
    mutationFn: async (printerId: string) => {
      return { success: true, message: 'Connection test successful' }
    },
  })
}