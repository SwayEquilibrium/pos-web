'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { flags } from '@/src/config/flags'

export default function OperationsBookingPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to booking management if reservations flag is enabled
    if (flags.reservationsV1) {
      router.replace('/admin/booking')
    } else {
      // Show coming soon message when flag is disabled
      router.replace('/admin/booking')
    }
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting to booking management...</p>
    </div>
  )
}
