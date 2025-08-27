/**
 * React hooks for printer management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PrinterRepository } from '@/lib/repos/printer.simple.repo'

// ================================================
// PRINTER HOOKS
// ================================================

export function usePrinters() {
  return useQuery({
    queryKey: ['printers'],
    queryFn: () => PrinterRepository.getAllPrinters(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePrinterConfig(printerId: string | null) {
  return useQuery({
    queryKey: ['printer-config', printerId],
    queryFn: async () => {
      if (!printerId) return null
      
      const printer = await PrinterRepository.getPrinter(printerId)
      if (!printer) return null
      
      const [roomAssignments, productTypeAssignments] = await Promise.all([
        PrinterRepository.getRoomAssignments(printerId),
        PrinterRepository.getProductTypeAssignments(printerId)
      ])
      
      return {
        printer,
        assigned_rooms: roomAssignments,
        assigned_product_types: productTypeAssignments
      }
    },
    enabled: !!printerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreatePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (formData: any) => PrinterRepository.upsertPrinter(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
  })
}

export function useUpdatePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ printerId, formData }: { printerId: string; formData: any }) => 
      PrinterRepository.upsertPrinter(formData, printerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      queryClient.invalidateQueries({ queryKey: ['printer-config', variables.printerId] })
    },
  })
}

export function useTestPrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (printerId: string) => PrinterRepository.testPrinter(printerId),
    onSuccess: (_, printerId) => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      queryClient.invalidateQueries({ queryKey: ['printer-config', printerId] })
    },
  })
}

export function useDeletePrinter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (printerId: string) => PrinterRepository.deletePrinter(printerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
  })
}

// ================================================
// UTILITY HOOKS
// ================================================

export function usePrinterTestResults() {
  const queryClient = useQueryClient()
  
  const clearTestResults = () => {
    queryClient.invalidateQueries({ queryKey: ['printers'] })
  }
  
  return { clearTestResults }
}
