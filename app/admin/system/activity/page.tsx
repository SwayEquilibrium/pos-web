'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SystemActivityPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing activity page
    router.replace('/admin/settings/activity')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
