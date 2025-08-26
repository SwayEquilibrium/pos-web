'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SystemPrintersPage() {
  const router = useRouter()
  
  useEffect(() => {
    // This would redirect to a printers page when it exists
    // For now, show a placeholder
    // router.replace('/admin/settings/printers')
  }, [router])

  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">🖨️ Printer Settings</h1>
        <p className="text-muted-foreground">Printer configuration coming soon...</p>
      </div>
    </div>
  )
}
