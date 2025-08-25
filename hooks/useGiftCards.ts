import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { giftCardService, type GiftCard, type CreateGiftCardParams, type RedeemGiftCardParams } from '@/lib/giftCardService'
import { useCompany } from './useCompany'

export function useGiftCards(options?: {
  status?: string
  limit?: number
  offset?: number
}) {
  const { company } = useCompany()
  
  return useQuery({
    queryKey: ['giftCards', company?.id, options],
    queryFn: () => giftCardService.getGiftCards(company!.id, options),
    enabled: !!company?.id,
    staleTime: 30000, // 30 seconds
  })
}

export function useGiftCard(code: string) {
  return useQuery({
    queryKey: ['giftCard', code],
    queryFn: () => giftCardService.getGiftCardByCode(code),
    enabled: !!code && code.length >= 16,
    staleTime: 10000, // 10 seconds
  })
}

export function useGiftCardBalance(code: string) {
  return useQuery({
    queryKey: ['giftCardBalance', code],
    queryFn: () => giftCardService.checkBalance(code),
    enabled: !!code && code.length >= 16,
    staleTime: 10000, // 10 seconds
  })
}

export function useGiftCardStats() {
  const { company } = useCompany()
  
  return useQuery({
    queryKey: ['giftCardStats', company?.id],
    queryFn: () => giftCardService.getGiftCardStats(company!.id),
    enabled: !!company?.id,
    staleTime: 60000, // 1 minute
  })
}

export function useSearchGiftCards() {
  const { company } = useCompany()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const query = useQuery({
    queryKey: ['searchGiftCards', company?.id, debouncedSearchTerm],
    queryFn: () => giftCardService.searchGiftCards(company!.id, debouncedSearchTerm),
    enabled: !!company?.id && debouncedSearchTerm.length >= 2,
    staleTime: 30000,
  })

  return {
    ...query,
    searchTerm,
    setSearchTerm,
  }
}

export function useCreateGiftCard() {
  const queryClient = useQueryClient()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (params: CreateGiftCardParams) => 
      giftCardService.createGiftCard(company!.id, params),
    onSuccess: () => {
      // Invalidate and refetch gift cards
      queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      queryClient.invalidateQueries({ queryKey: ['giftCardStats'] })
    },
  })
}

export function useRedeemGiftCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: RedeemGiftCardParams) => 
      giftCardService.redeemGiftCard(params),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['giftCard', variables.code] })
      queryClient.invalidateQueries({ queryKey: ['giftCardBalance', variables.code] })
      queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      queryClient.invalidateQueries({ queryKey: ['giftCardStats'] })
    },
  })
}

export function useCancelGiftCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ giftCardId, reason }: { giftCardId: string; reason?: string }) =>
      giftCardService.cancelGiftCard(giftCardId, reason),
    onSuccess: () => {
      // Invalidate and refetch gift cards
      queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      queryClient.invalidateQueries({ queryKey: ['giftCardStats'] })
    },
  })
}

export function useGiftCardTransactions(giftCardId: string) {
  return useQuery({
    queryKey: ['giftCardTransactions', giftCardId],
    queryFn: () => giftCardService.getTransactions(giftCardId),
    enabled: !!giftCardId,
    staleTime: 30000,
  })
}

// Custom hook for gift card form state management
export function useGiftCardForm() {
  const [formData, setFormData] = useState<CreateGiftCardParams>({
    amount: 0,
    recipient_name: '',
    recipient_email: '',
    sender_name: '',
    sender_email: '',
    message: '',
    expiry_months: 12
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount < 50) {
      newErrors.amount = 'Minimum beløb er 50 kr'
    }

    if (formData.amount > 10000) {
      newErrors.amount = 'Maksimum beløb er 10.000 kr'
    }

    if (formData.recipient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient_email)) {
      newErrors.recipient_email = 'Ugyldig email adresse'
    }

    if (formData.sender_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sender_email)) {
      newErrors.sender_email = 'Ugyldig email adresse'
    }

    if (!formData.expiry_months || formData.expiry_months < 1) {
      newErrors.expiry_months = 'Udløbsperiode skal være mindst 1 måned'
    }

    if (formData.expiry_months > 60) {
      newErrors.expiry_months = 'Udløbsperiode kan ikke være mere end 60 måneder'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateField = (field: keyof CreateGiftCardParams, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const resetForm = () => {
    setFormData({
      amount: 0,
      recipient_name: '',
      recipient_email: '',
      sender_name: '',
      sender_email: '',
      message: '',
      expiry_months: 12
    })
    setErrors({})
  }

  return {
    formData,
    errors,
    validateForm,
    updateField,
    resetForm,
    isValid: Object.keys(errors).length === 0 && formData.amount >= 50
  }
}

// Hook for gift card lookup/validation
export function useGiftCardLookup() {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  
  const balanceQuery = useGiftCardBalance(code)
  const giftCardQuery = useGiftCard(code)

  const validateCode = async (inputCode: string) => {
    const cleanCode = inputCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    if (cleanCode.length !== 16) {
      return { valid: false, message: 'Gavekort kode skal være 16 tegn' }
    }

    setCode(cleanCode)
    setIsValidating(true)

    try {
      const balance = await balanceQuery.refetch()
      setIsValidating(false)

      if (!balance.data?.found) {
        return { valid: false, message: 'Gavekort ikke fundet' }
      }

      return { 
        valid: true, 
        giftCard: balance.data,
        message: 'Gavekort fundet'
      }
    } catch (error) {
      setIsValidating(false)
      return { valid: false, message: 'Fejl ved validering af gavekort' }
    }
  }

  const clearCode = () => {
    setCode('')
    setIsValidating(false)
  }

  return {
    code,
    setCode,
    isValidating,
    validateCode,
    clearCode,
    giftCard: giftCardQuery.data,
    balance: balanceQuery.data,
    isLoading: balanceQuery.isLoading || giftCardQuery.isLoading
  }
}
