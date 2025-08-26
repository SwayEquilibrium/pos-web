'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layout, Package, Settings, Users, Calendar, Clock, ChefHat } from 'lucide-react'
import { flags } from '@/src/config/flags'

export default function HomePage() {
  const router = useRouter()
  
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
  
  // Mock data - in a real app, this would come from your database
  const stats = {
    todayOrders: 87,
    activeTables: 8,
    totalTables: 12,
    takeawayOrders: 12
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
      stats: 'Administration & indstillinger'
    }
  ]

  // Secondary management options (second row)
  const secondaryOptions = [
    {
      id: 'booking',
      title: 'Bordreservation',
      description: 'Administrer bordreservationer og booking',
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
      path: '/admin/booking',
      stats: flags.reservationsV1 ? `${todayReservations.length} reservationer i dag` : '3 reservationer i dag'
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payper Steak House</h1>
          <p className="text-muted-foreground">Vælg din arbejdsområde</p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
            <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.todayOrders}</div>
                <div className="text-sm text-muted-foreground">Dagens ordrer</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.activeTables}</div>
                <div className="text-sm text-muted-foreground">Aktive borde</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.takeawayOrders}</div>
                <div className="text-sm text-muted-foreground">Takeaway</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Options */}
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Primary Options - First Row */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Hovedfunktioner</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryOptions.map(option => (
              <Card 
                key={option.id} 
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${option.color} hover:scale-105 border-2`}
                onClick={() => router.push(option.path)}
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

        {/* Secondary Options - Second Row */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Planlægning & Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {secondaryOptions.map(option => (
              <Card 
                key={option.id} 
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${option.color} hover:scale-105 border-2`}
                onClick={() => router.push(option.path)}
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

      {/* Notification Center */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-center">
          {/* NotificationCenter component removed */}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium">System Status</span>
              </div>
              <p className="text-sm text-muted-foreground">Alle systemer kører normalt</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Aktive Brugere</span>
              </div>
              <p className="text-lg font-bold">3</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium">Backup</span>
              </div>
              <p className="text-sm text-muted-foreground">Seneste: I dag 03:00</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}