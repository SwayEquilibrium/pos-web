'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layout, Package, Settings, Calendar, Clock } from 'lucide-react'
import { useSmoothNavigation } from './SmoothNavigation.v1'

interface NavigationOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  path: string
  stats: string
}

interface OptimizedMainNavigationProps {
  stats: {
    todayOrders: number
    activeTables: number
    totalTables: number
    takeawayOrders: number
  }
  todayReservations?: any[]
}

export default function OptimizedMainNavigation({ 
  stats, 
  todayReservations = [] 
}: OptimizedMainNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, navigate, prefetchRoute } = useSmoothNavigation()

  // Primary operational options (first row)
  const primaryOptions: NavigationOption[] = [
    {
      id: 'tables',
      title: 'Bordoversigt',
      description: 'Se bordlayout og opret ordrer til dine borde',
      icon: <Layout className="w-12 h-12" />,
      color: 'bg-muted/50 text-foreground border-border',
      path: '/tables',
      stats: `${stats.activeTables}/${stats.totalTables} borde optaget`
    },
    {
      id: 'takeaway',
      title: 'Takeaway',
      description: 'Administrer takeaway ordrer og afhentning',
      icon: <Package className="w-12 h-12" />,
      color: 'bg-muted/50 text-foreground border-border',
      path: '/takeaway',
      stats: `${stats.takeawayOrders} aktive ordrer`
    },
    {
      id: 'modules',
      title: 'Moduler',
      description: 'Administrative indstillinger og systemkonfiguration',
      icon: <Settings className="w-12 h-12" />,
      color: 'bg-muted/50 text-foreground border-border',
      path: '/modules',
      stats: 'Administration & indstillinger'
    }
  ]

  // Secondary management options (second row)
  const secondaryOptions: NavigationOption[] = [
    {
      id: 'booking',
      title: 'Bordreservation',
      description: 'Administrer bordreservationer og booking',
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
      path: '/admin/booking',
      stats: `${todayReservations.length} reservationer i dag`
    },
    {
      id: 'shifts',
      title: 'Vagtplan',
      description: 'Administrer medarbejdervagter og planlægning',
      icon: <Clock className="w-12 h-12 text-purple-600" />,
      color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
      path: '/admin/shifts',
      stats: '2 aktive vagter'
    }
  ]

  const handleNavigation = async (path: string) => {
    await navigate(path)
  }

  const handleHover = (path: string) => {
    prefetchRoute(path)
  }

  const renderNavigationCard = (option: NavigationOption) => {
    const isActive = pathname === option.path
    const isTarget = state.targetPath === option.path
    const isTransitioning = state.isTransitioning

    return (
      <Card 
        key={option.id} 
        className={`
          cursor-pointer transition-all duration-200 ease-out border-2
          ${option.color}
          ${isActive ? 'scale-105 shadow-xl ring-2 ring-primary/20' : 'hover:scale-105 hover:shadow-xl'}
          ${isTarget && isTransitioning ? 'animate-pulse scale-105 shadow-xl' : ''}
          ${isTransitioning && !isTarget ? 'opacity-70 scale-[0.98]' : ''}
          active:scale-[1.02]
        `}
        onClick={() => handleNavigation(option.path)}
        onMouseEnter={() => handleHover(option.path)}
      >
        <CardContent className="p-8 text-center relative overflow-hidden">
          {/* Shimmer effect for active navigation */}
          {isTarget && isTransitioning && (
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          )}
          
          <div className={`mb-6 flex justify-center items-center transition-transform duration-200 ${
            isTarget && isTransitioning ? 'scale-110' : ''
          }`}>
            {isTarget && isTransitioning ? (
              <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              option.icon
            )}
          </div>
          <h2 className="text-2xl font-bold mb-3">{option.title}</h2>
          <p className="text-base text-muted-foreground mb-4">{option.description}</p>
          <Badge variant="secondary" className="text-sm font-medium">
            {option.stats}
          </Badge>
          
          {/* Progress indicator */}
          {isTarget && isTransitioning && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Primary Options - First Row */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-center">Hovedfunktioner</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {primaryOptions.map(renderNavigationCard)}
        </div>
      </div>

      {/* Secondary Options - Second Row */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-center">Planlægning & Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {secondaryOptions.map(renderNavigationCard)}
        </div>
      </div>
    </>
  )
}
