'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Layout, 
  Package
} from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

interface AppLayoutProps {
  children: React.ReactNode
  showTableControls?: boolean
  isEditMode?: boolean
  onEditModeToggle?: () => void
  onCreateTable?: () => void
  onSaveLayout?: () => void
  onResetLayout?: () => void
  isListView?: boolean
  onViewToggle?: (isListView: boolean) => void
}

export default function AppLayout({ 
  children, 
  showTableControls = false, 
  isEditMode = false, 
  onEditModeToggle, 
  onCreateTable, 
  onSaveLayout, 
  onResetLayout,
  isListView = false,
  onViewToggle
}: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)
  
  // Mock takeaway data for badge count
  const newTakeawayOrders = 2

  const handleSmoothNavigation = async (href: string) => {
    if (pathname === href || isTransitioning) return
    
    setIsTransitioning(true)
    setTargetPath(href)
    
    setTimeout(() => {
      router.push(href)
      setTimeout(() => {
        setIsTransitioning(false)
        setTargetPath(null)
      }, 150)
    }, 150)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar - Hidden on tables page to avoid white space */}
      {pathname !== '/tables' && (
        <div className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50 relative">
        <div className="flex items-center gap-4">
          {/* Back Button moved to global header above violet sections */}
          
          {/* Removed Payper Steak House, Borde button, and other navigation buttons */}
        </div>

        <div className="flex items-center gap-3">
          {/* Table Controls moved to orange header */}

          {/* Removed takeaway and moduler buttons */}
        </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
