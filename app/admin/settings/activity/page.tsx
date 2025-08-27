'use client'

import { useRouter } from 'next/navigation'
import ActivityLogs from '../../../settings/components/ActivityLogs'
import { SimpleBackButton } from '@/components/BackNavigation'

export default function AdminActivityLogs() {
  const router = useRouter()
  
  return (
    <div className="p-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aktivitetslog</h1>
        <p className="text-muted-foreground">Se alle systemaktiviteter og ændringer</p>
      </div>
      
      <ActivityLogs />
    </div>
  )
}
