'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Package,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  DollarSign,
  ShoppingCart
} from 'lucide-react'

export default function ModulesPage() {
  // Mock data - in a real app, this would come from your database
  const stats = {
    todayOrders: 87,
    activeTables: 8,
    totalTables: 12,
    takeawayOrders: 12,
    todayRevenue: 15420,
    avgOrderValue: 285,
    activeUsers: 3,
    pendingReservations: 7
  }

  const quickStats = [
    {
      title: 'Dagens Ordrer',
      value: stats.todayOrders,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Aktive Borde',
      value: `${stats.activeTables}/${stats.totalTables}`,
      icon: <Users className="w-6 h-6" />,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Takeaway Ordrer',
      value: stats.takeawayOrders,
      icon: <Package className="w-6 h-6" />,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Dagens Omsætning',
      value: `${stats.todayRevenue.toLocaleString('da-DK')} kr`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Gennemsnitlig Ordre',
      value: `${stats.avgOrderValue} kr`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Reservationer',
      value: stats.pendingReservations,
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    }
  ]

  const recentActivity = [
    { time: '10:32', action: 'Ny ordre oprettet', details: 'Bord 5 - 3 personer', type: 'order' },
    { time: '10:28', action: 'Betaling gennemført', details: 'Takeaway ordre #1247', type: 'payment' },
    { time: '10:25', action: 'Reservation oprettet', details: 'I morgen kl. 19:30 - 4 personer', type: 'reservation' },
    { time: '10:20', action: 'Bord frigivet', details: 'Bord 3 - ordre afsluttet', type: 'table' },
    { time: '10:15', action: 'Ny takeaway ordre', details: 'Ordre #1246 - afhentes kl. 11:00', type: 'takeaway' }
  ]

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Oversigt over systemets status og aktivitet</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Seneste Aktivitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className="text-sm text-muted-foreground font-mono min-w-[50px]">
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium">System Status</span>
              </div>
              <p className="text-sm text-muted-foreground">Alle systemer kører normalt</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                <span className="font-medium">Aktive Brugere</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
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
