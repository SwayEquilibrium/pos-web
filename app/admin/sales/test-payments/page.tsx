'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesTestPaymentsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing test-payments page
    router.replace('/admin/test-payments')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
