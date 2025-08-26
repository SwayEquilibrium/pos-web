'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SystemDisplayPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing display page
    router.replace('/admin/settings/display')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
