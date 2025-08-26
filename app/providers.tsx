'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { CustomToaster } from '@/lib/toast'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        {children}
        <CustomToaster />
      </LanguageProvider>
    </QueryClientProvider>
  )
}
