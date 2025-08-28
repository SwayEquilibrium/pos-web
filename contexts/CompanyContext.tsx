'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// ================================================
// COMPANY CONTEXT - COMPANY DATA MANAGEMENT
// ================================================

interface Company {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  currency: string
  timezone: string
  tax_rate: number
  created_at: string
  updated_at: string
}

interface CompanyContextType {
  // Data
  company: Company | null
  
  // Loading & Error states
  isLoading: boolean
  error: any
  
  // Actions
  updateCompany: (updates: Partial<Company>) => Promise<void>
  
  // Computed values
  companyName: string
  companyLogo: string | null
  currency: string
  timezone: string
  taxRate: number
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

// ================================================
// PROVIDER COMPONENT
// ================================================

interface CompanyProviderProps {
  children: ReactNode
  companyId?: string
}

export function CompanyProvider({ children, companyId }: CompanyProviderProps) {
  // Fetch company data
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) {
        // Get the first company if no ID provided
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('active', true)
          .limit(1)
          .single()
        
        if (error) throw error
        return data
      }
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('active', true)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Actions
  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!company?.id) {
      throw new Error('No company selected')
    }
    
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', company.id)
    
    if (error) throw error
  }, [company?.id])
  
  // Computed values
  const companyName = company?.name || 'Restaurant'
  const companyLogo = company?.logo_url || null
  const currency = company?.currency || 'DKK'
  const timezone = company?.timezone || 'Europe/Copenhagen'
  const taxRate = company?.tax_rate || 25
  
  const value: CompanyContextType = {
    // Data
    company: company || null,
    
    // Loading & Error states
    isLoading,
    error,
    
    // Actions
    updateCompany,
    
    // Computed values
    companyName,
    companyLogo,
    currency,
    timezone,
    taxRate,
  }
  
  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// ================================================
// HOOK
// ================================================

export function useCompanyContext(): CompanyContextType {
  const context = useContext(CompanyContext)
  
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider')
  }
  
  return context
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useCompany() {
  const { company, isLoading, error } = useCompanyContext()
  return { company, isLoading, error }
}

export function useCompanySettings() {
  const { company, updateCompany } = useCompanyContext()
  
  const updateCompanyName = useCallback(async (name: string) => {
    await updateCompany({ name })
  }, [updateCompany])
  
  const updateCompanyLogo = useCallback(async (logoUrl: string) => {
    await updateCompany({ logo_url: logoUrl })
  }, [updateCompany])
  
  const updateCompanyContact = useCallback(async (contact: {
    address?: string
    phone?: string
    email?: string
    website?: string
  }) => {
    await updateCompany(contact)
  }, [updateCompany])
  
  const updateCompanyFinancial = useCallback(async (financial: {
    currency?: string
    tax_rate?: number
  }) => {
    await updateCompany(financial)
  }, [updateCompany])
  
  return {
    company,
    updateCompanyName,
    updateCompanyLogo,
    updateCompanyContact,
    updateCompanyFinancial,
  }
}

export function useCompanyDisplay() {
  const { companyName, companyLogo, currency, timezone, taxRate } = useCompanyContext()
  
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }, [currency])
  
  const formatTaxAmount = useCallback((amount: number) => {
    const taxAmount = amount * (taxRate / 100)
    return formatCurrency(taxAmount)
  }, [taxRate, formatCurrency])
  
  const getTaxRateDisplay = useCallback(() => {
    return `${taxRate}%`
  }, [taxRate])
  
  return {
    companyName,
    companyLogo,
    currency,
    timezone,
    taxRate,
    formatCurrency,
    formatTaxAmount,
    getTaxRateDisplay,
  }
}
