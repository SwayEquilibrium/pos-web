'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OperationsShiftsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing shifts page
    router.replace('/admin/shifts')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
