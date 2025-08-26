'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessUsersPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing users page
    router.replace('/admin/settings/users')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
