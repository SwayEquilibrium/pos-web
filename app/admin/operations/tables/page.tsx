'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OperationsTablesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the existing tables page
    router.replace('/admin/settings/tables')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting...</p>
    </div>
  )
}
