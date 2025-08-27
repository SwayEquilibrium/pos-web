'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChefHat,
  ShoppingCart,
  Users,
  Settings,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react'

export default function ModulesPage() {
  const router = useRouter()

  const modules = [
    {
      id: 'menu',
      title: 'Menu Management',
      description: 'Manage your menu items, categories, pricing, and modifiers',
      icon: <ChefHat className="w-8 h-8 text-blue-600" />,
      href: '/modules/menu',
      stats: '127 items',
      color: 'blue'
    },
    {
      id: 'orders',
      title: 'Order Processing',
      description: 'View and manage incoming orders, track preparation status',
      icon: <ShoppingCart className="w-8 h-8 text-green-600" />,
      href: '/tables',
      stats: '23 pending',
      color: 'green'
    },
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Manage customer profiles, loyalty programs, and groups',
      icon: <Users className="w-8 h-8 text-purple-600" />,
      href: '/admin/business/users',
      stats: '1,247 customers',
      color: 'purple'
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system preferences, integrations, and user permissions',
      icon: <Settings className="w-8 h-8 text-gray-600" />,
      href: '/settings',
      stats: 'Configure',
      color: 'gray'
    }
  ]

  const quickStats = [
    {
      title: 'Today\'s Orders',
      value: '47',
      change: '+12%',
      trend: 'up',
      icon: <ShoppingCart className="w-5 h-5 text-blue-600" />
    },
    {
      title: 'Active Menu Items',
      value: '127',
      change: '+3',
      trend: 'up',
      icon: <ChefHat className="w-5 h-5 text-green-600" />
    },
    {
      title: 'Avg. Order Time',
      value: '12m',
      change: '-2m',
      trend: 'down',
      icon: <Clock className="w-5 h-5 text-orange-600" />
    },
    {
      title: 'Revenue Today',
      value: '€2,847',
      change: '+18%',
      trend: 'up',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Modules
        </h2>
        <p className="text-gray-600">
          Manage your restaurant operations from this centralized dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Available Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Card 
              key={module.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${module.color}-50 rounded-lg`}>
                      {module.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {module.stats}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {module.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(module.href)
                  }}
                >
                  Open Module
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Menu item "Margherita Pizza" was updated</span>
              </div>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">New order #1247 received</span>
              </div>
              <span className="text-xs text-gray-500">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Customer "John Smith" added to VIP group</span>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Category "Beverages" was reordered</span>
              </div>
              <span className="text-xs text-gray-500">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}