'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OperationsTablesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main tables page
    router.replace('/tables')
  }, [router])

  return (
    <div className="p-6">
      <p>Redirecting to table management...</p>
    </div>
  )
}
