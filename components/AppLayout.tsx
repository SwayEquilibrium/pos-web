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
      {/* Top Navigation Bar */}
      <div className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50 relative">
        <div className="flex items-center gap-4">
          {/* Back Button - Always visible when not on main overview */}
          {pathname !== '/' && (
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Back button clicked! Current pathname:', pathname)
                console.log('Navigating to main page...')
                alert('Back button clicked! Navigating to main page...')
                window.location.href = '/'
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-12 px-4 text-base border-2 hover:border-primary hover:text-primary cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
{t('backToOverview')}
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">🥩</span>
            </div>
            <span className="font-semibold">Payper Steak House</span>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          <Button
            variant={pathname === '/tables' ? 'default' : 'ghost'}
            size="lg"
            onClick={() => {
              console.log('Borde button clicked, navigating to /tables')
              router.push('/tables')
            }}
            className="flex items-center gap-2 h-12 px-6 text-base font-medium"
          >
            <Layout className="w-5 h-5" />
            Borde
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Table Controls - only show on tables page */}
          {showTableControls && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={onCreateTable}
                className="flex items-center gap-2 h-12 px-6 text-base font-medium bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                ➕ Opret
              </Button>
              
              {isEditMode ? (
                <>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={onResetLayout}
                    className="flex items-center gap-2 h-12 px-6 text-base font-medium"
                  >
                    🔄 Nulstil
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={onSaveLayout}
                    className="flex items-center gap-2 h-12 px-6 text-base font-medium bg-green-600 hover:bg-green-700"
                  >
                    💾 Gem
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onEditModeToggle}
                  className="flex items-center gap-2 h-12 px-6 text-base font-medium bg-orange-600 hover:bg-orange-700 text-white"
                >
                  ✏️ Rediger
                </Button>
              )}
              
              <div className="h-6 w-px bg-border mx-2" />
            </>
          )}

          {/* View Toggle - only show on tables page */}
          {showTableControls && onViewToggle && (
            <>
              <Button
                variant={!isListView ? 'default' : 'outline'}
                size="lg"
                onClick={() => onViewToggle(false)}
                className="flex items-center gap-2 h-12 px-6 text-base font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 5 3-3 3 3" />
                </svg>
                2D View
              </Button>
              <Button
                variant={isListView ? 'default' : 'outline'}
                size="lg"
                onClick={() => onViewToggle(true)}
                className="flex items-center gap-2 h-12 px-6 text-base font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
                Liste
              </Button>
              
              <div className="h-6 w-px bg-border mx-2" />
            </>
          )}

          <Button
            variant={pathname === '/takeaway' ? 'default' : 'outline'}
            size="lg"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSmoothNavigation('/takeaway')
            }}
            disabled={isTransitioning}
            className={`flex items-center gap-2 h-12 px-6 text-base font-medium cursor-pointer z-50 transition-all duration-300 ${
              pathname === '/takeaway' ? 'scale-105 shadow-lg' : 'hover:scale-105 hover:shadow-md'
            } ${
              targetPath === '/takeaway' ? 'animate-pulse' : ''
            } ${
              isTransitioning && targetPath !== '/takeaway' ? 'opacity-60 scale-95' : ''
            }`}
          >
            {targetPath === '/takeaway' && isTransitioning ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            {t('takeaway')}
            {newTakeawayOrders > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {newTakeawayOrders}
              </Badge>
            )}
          </Button>

          <Button
            variant={pathname === '/modules' ? 'default' : 'outline'}
            size="lg"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSmoothNavigation('/modules')
            }}
            disabled={isTransitioning}
            className={`flex items-center gap-2 h-12 px-6 text-base font-medium cursor-pointer z-50 transition-all duration-300 ${
              pathname === '/modules' ? 'scale-105 shadow-lg' : 'hover:scale-105 hover:shadow-md'
            } ${
              targetPath === '/modules' ? 'animate-pulse' : ''
            } ${
              isTransitioning && targetPath !== '/modules' ? 'opacity-60 scale-95' : ''
            }`}
          >
            {targetPath === '/modules' && isTransitioning ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Settings className="w-5 h-5" />
            )}
            {t('modules')}
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
