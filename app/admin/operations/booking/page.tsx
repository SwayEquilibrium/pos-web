'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OperationsBookingPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing booking page
    router.replace('/admin/booking')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
