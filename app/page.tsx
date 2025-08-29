'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layout, Package, Settings, Users, Calendar, Clock, ChefHat } from 'lucide-react'
import { flags } from '@/src/config/flags'
import { useCurrentCompany } from '@/hooks/useCompany'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  
  // Get company data for dynamic display
  const { data: currentCompany, isLoading: companyLoading } = useCurrentCompany()
  
  // Check authentication and redirect accordingly
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is authenticated - stay on this page (POS interface)
          console.log('User authenticated, showing POS interface')
          setUser(session.user)
          
          // Prefetch common routes to reduce cold start delay
          router.prefetch('/tables')
          router.prefetch('/takeaway')
          router.prefetch('/modules')
        } else {
          // User not authenticated - redirect to landing
          console.log('User not authenticated, redirecting to landing')
          router.push('/landing')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/landing')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  // Import reservation hooks only when flag is enabled
  let useReservations: any = null
  if (flags.reservationsV1) {
    try {
      const hooks = require('@/proposals/hooks/useReservations.v1')
      useReservations = hooks.useReservations
    } catch (error) {
      console.warn('Could not load reservation hooks:', error)
    }
  }
  
  // Get today's reservations if flag is enabled
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReservations = [] } = flags.reservationsV1 && useReservations 
    ? useReservations({ date: today, status: 'confirmed' })
    : { data: [] }

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/landing')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Navigation handler with immediate feedback
  const handleNavigation = (path: string) => {
    setNavigatingTo(path)
    router.push(path)
  }
  
  // Mock data - in a real app, this would come from your database
  const stats = {
    todayOrders: 87,
    activeTables: 8,
    totalTables: 12,
    takeawayOrders: 12
  }

  // Prefetch routes on hover to reduce cold start delay
  const prefetchRoute = (path: string) => {
    router.prefetch(path)
  }

  // Primary operational options (first row)
  const primaryOptions = [
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
      stats: 'System administration'
    }
  ]

  // Secondary options (second row)
  const secondaryOptions = [
    {
      id: 'users',
      title: 'Brugere',
      description: 'Administrer brugere og tilladelser',
      icon: <Users className="w-10 h-10" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      path: '/admin/business/users',
      stats: 'Bruger administration'
    },
    {
      id: 'calendar',
      title: 'Kalender',
      description: 'Se planlægning og reservationer',
      icon: <Calendar className="w-10 h-10" />,
      color: 'bg-green-50 text-green-700 border-green-200',
      path: '/admin/operations/booking',
      stats: 'Reservationer & planlægning'
    },
    {
      id: 'shifts',
      title: 'Vagter',
      description: 'Administrer medarbejder vagter',
      icon: <Clock className="w-10 h-10" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      path: '/admin/operations/shifts',
      stats: 'Vagt administration'
    },
    {
      id: 'menu',
      title: 'Menu',
      description: 'Rediger menukort og produkter',
      icon: <ChefHat className="w-10 h-10" />,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      path: '/modules/menu',
      stats: 'Menu administration'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Header Section - Centered */}
      <div className="bg-card border-b px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {companyLoading ? (
                <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : currentCompany?.logo_url ? (
                <img 
                  src={currentCompany.logo_url} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to icon if logo fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 text-primary-foreground ${companyLoading || currentCompany?.logo_url ? 'hidden' : ''}`}>
                <Settings className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {companyLoading ? 'Loading...' : (currentCompany?.name || 'Payper Steak House')}
            </h1>
            <p className="text-muted-foreground">Vælg din arbejdsområde</p>
          </div>
        </div>
      </div>

      {/* Top Bar with User Info */}
      <div className="bg-muted/50 border-b px-6 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium text-green-700">Online</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Velkommen, {user?.email}
            </span>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              Log ud
            </Button>
          </div>
        </div>
      </div>
      
      {/* Quick Stats - Centered - Made Smaller */}
      <div className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
          <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{stats.todayOrders}</div>
              <div className="text-xs text-muted-foreground">Dagens ordrer</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{stats.activeTables}</div>
              <div className="text-xs text-muted-foreground">Aktive borde</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-foreground">{stats.takeawayOrders}</div>
              <div className="text-xs text-muted-foreground">Takeaway</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Options - Centered */}
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Primary Options - First Row - Made Larger (Stars of the Show) */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Hovedfunktioner</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {primaryOptions.map(option => (
              <Card 
                key={option.id} 
                className={`cursor-pointer hover:shadow-2xl transition-all duration-300 ${option.color} hover:scale-105 border-2 ${
                  navigatingTo === option.path ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''
                }`}
                onClick={() => handleNavigation(option.path)}
                onMouseEnter={() => prefetchRoute(option.path)}
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 flex justify-center items-center">
                    <div className="w-16 h-16 flex items-center justify-center">
                      {navigatingTo === option.path ? (
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        option.icon
                      )}
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-3">{option.title}</h2>
                  <p className="text-lg text-muted-foreground mb-4 leading-relaxed">{option.description}</p>
                  <Badge variant="secondary" className="text-base font-medium px-4 py-2">
                    {navigatingTo === option.path ? 'Loading...' : option.stats}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Secondary Options - Second Row - Keep Nice Size */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Planlægning & Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {secondaryOptions.map(option => (
              <Card 
                key={option.id} 
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${option.color} hover:scale-105 border-2`}
                onClick={() => handleNavigation(option.path)}
                onMouseEnter={() => prefetchRoute(option.path)}
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6 flex justify-center items-center">
                    {option.icon}
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{option.title}</h2>
                  <p className="text-base text-muted-foreground mb-4">{option.description}</p>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {option.stats}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Reservations Preview */}
      {flags.reservationsV1 && todayReservations.length > 0 && (
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Dagens reservationer</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todayReservations.slice(0, 3).map((reservation: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{reservation.customer_name || 'Gæst'}</p>
                      <p className="text-xs text-gray-600">{reservation.time || 'Tidspunkt'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {todayReservations.length > 3 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => router.push('/admin/operations/booking')}>
                    Se alle ({todayReservations.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}