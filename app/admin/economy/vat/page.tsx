'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EconomyVatPage() {
  const router = useRouter()
  
  useEffect(() => {
    // This would redirect to a VAT/accounting page when it exists
    // For now, redirect to economy reports
    router.replace('/admin/economy/reports')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
