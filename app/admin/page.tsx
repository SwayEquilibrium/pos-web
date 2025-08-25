'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const router = useRouter()
  
  // Mock data - in a real app, this would come from your database
  const stats = {
    todaySales: 12450,
    todayOrders: 87,
    avgOrderValue: 143,
    topProduct: 'Bøf med pommes',
    activeUsers: 3,
    tablesOccupied: 8,
    totalTables: 12
  }

  const recentOrders = [
    { id: '001', table: 'Bord 3', amount: 245, time: '14:32', status: 'completed' },
    { id: '002', table: 'Bord 7', amount: 189, time: '14:28', status: 'pending' },
    { id: '003', table: 'Bord 1', amount: 567, time: '14:25', status: 'completed' },
    { id: '004', table: 'Bord 5', amount: 123, time: '14:20', status: 'completed' },
  ]

  const topProducts = [
    { name: 'Bøf med pommes', sold: 23, revenue: 2760 },
    { name: 'Caesar Salat', sold: 18, revenue: 1980 },
    { name: 'Pasta Carbonara', sold: 15, revenue: 1875 },
    { name: 'Bruschetta', sold: 12, revenue: 1080 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Oversigt over dagens aktivitet</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dagens Salg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySales.toLocaleString()} kr</div>
            <div className="text-xs text-green-600 mt-1">+12% fra i går</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dagens Ordrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <div className="text-xs text-green-600 mt-1">+8% fra i går</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gennemsnit pr. Ordre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOrderValue} kr</div>
            <div className="text-xs text-red-600 mt-1">-3% fra i går</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Borde Optaget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tablesOccupied}/{stats.totalTables}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.tablesOccupied / stats.totalTables) * 100)}% kapacitet
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛒 Seneste Ordrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">#{order.id}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.table}</p>
                      <p className="text-xs text-muted-foreground">{order.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.amount} kr</span>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status === 'completed' ? 'Betalt' : 'Afventer'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Se alle ordrer
            </Button>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Top Produkter i dag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sold} solgt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{product.revenue.toLocaleString()} kr</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Se detaljeret rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Hurtige Handlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <span className="text-lg">➕</span>
              <span className="text-sm">Nyt Produkt</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <span className="text-lg">🪑</span>
              <span className="text-sm">Administrer Borde</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <span className="text-lg">👤</span>
              <span className="text-sm">Ny Bruger</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <span className="text-lg">📊</span>
              <span className="text-sm">SAF-T Rapport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Alle systemer kører normalt</p>
            <p className="text-xs text-muted-foreground mt-1">Sidste opdatering: 14:35</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Brugere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Logget ind nu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Seneste: I dag 03:00</p>
            <p className="text-xs text-green-600 mt-1">✓ Succesfuld</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
