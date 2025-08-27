'use client'
import CustomerGroupsManager from '@/components/CustomerGroupsManager'

export default function CustomerGroupsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CustomerGroupsManager showHeader={true} />
    </div>
  )
}