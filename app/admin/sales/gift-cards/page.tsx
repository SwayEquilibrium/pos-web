'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesGiftCardsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing gift-cards page
    router.replace('/admin/settings/gift-cards')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
