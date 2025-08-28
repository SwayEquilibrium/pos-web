'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { CustomToaster } from '@/lib/toast'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        retry: 1, // Only retry once on failure
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnReconnect: true, // Do refetch on reconnect
      },
      mutations: {
        retry: 1, // Only retry once on failure
      },
    },
  }))
  
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        {children}
        <CustomToaster />
      </LanguageProvider>
    </QueryClientProvider>
  )
}
