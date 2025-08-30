'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChefHat,
  ShoppingCart,
  Users,
  Settings,
  Printer,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp,
  Calendar,
  Table,
  CreditCard,
  Gift,
  Activity
} from 'lucide-react'

export default function ModulesPage() {
  const router = useRouter()

  const modules = [
    // 🔄 OPERATIONAL MODULES
    {
      id: 'menu',
      title: 'Menu Management',
      description: 'Manage your menu items, categories, pricing, and modifiers',
      icon: <ChefHat className="w-8 h-8 text-blue-600" />,
      href: '/modules/menu',
      stats: '127 items',
      color: 'blue',
      category: 'operational'
    },
    {
      id: 'printers',
      title: 'Printer Management',
      description: 'Configure ethernet printers for kitchen and customer receipts',
      icon: <Printer className="w-8 h-8 text-orange-600" />,
      href: '/modules/printers',
      stats: '3 printers',
      color: 'orange',
      category: 'operational'
    },
    {
      id: 'orders',
      title: 'Order Processing',
      description: 'View and manage incoming orders, track preparation status',
      icon: <ShoppingCart className="w-8 h-8 text-green-600" />,
      href: '/tables',
      stats: '23 pending',
      color: 'green',
      category: 'operational'
    },

    // 👥 CUSTOMER & USER MANAGEMENT
    {
      id: 'customers',
      title: 'Customer Management',
      description: 'Manage customer profiles, loyalty programs, and groups',
      icon: <Users className="w-8 h-8 text-purple-600" />,
      href: '/modules/customers',
      stats: '1,247 customers',
      color: 'purple',
      category: 'customers'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage staff accounts, roles, and permissions',
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      href: '/modules/users',
      stats: '5 users',
      color: 'indigo',
      category: 'customers'
    },

    // 📊 BUSINESS INTELLIGENCE
    {
      id: 'analytics',
      title: 'Sales Analytics',
      description: 'Track performance, sales trends, and business insights',
      icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
      href: '/modules/analytics',
      stats: 'Today: €2,847',
      color: 'teal',
      category: 'analytics'
    },
    {
      id: 'reports',
      title: 'Business Reports',
      description: 'Generate detailed reports for accounting and management',
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      href: '/modules/reports',
      stats: 'Monthly',
      color: 'emerald',
      category: 'analytics'
    },

    // 📅 OPERATIONS & SCHEDULING
    {
      id: 'bookings',
      title: 'Table Bookings',
      description: 'Manage table reservations and customer bookings',
      icon: <Calendar className="w-8 h-8 text-rose-600" />,
      href: '/modules/bookings',
      stats: '8 today',
      color: 'rose',
      category: 'operations'
    },
    {
      id: 'tables',
      title: 'Table Management',
      description: 'Configure dining areas, tables, and seating arrangements',
      icon: <Table className="w-8 h-8 text-amber-600" />,
      href: '/modules/tables',
      stats: '12 tables',
      color: 'amber',
      category: 'operations'
    },
    {
      id: 'shifts',
      title: 'Staff Shifts',
      description: 'Schedule staff shifts and manage workforce planning',
      icon: <Clock className="w-8 h-8 text-cyan-600" />,
      href: '/modules/shifts',
      stats: 'Today: 3 shifts',
      color: 'cyan',
      category: 'operations'
    },

    // 💰 FINANCIAL MANAGEMENT
    {
      id: 'payments',
      title: 'Payment Settings',
      description: 'Configure payment methods, terminals, and integrations',
      icon: <CreditCard className="w-8 h-8 text-violet-600" />,
      href: '/modules/payments',
      stats: '3 methods',
      color: 'violet',
      category: 'finance'
    },
    {
      id: 'gift-cards',
      title: 'Gift Cards',
      description: 'Manage gift card programs and balance tracking',
      icon: <Gift className="w-8 h-8 text-pink-600" />,
      href: '/modules/gift-cards',
      stats: '45 active',
      color: 'pink',
      category: 'finance'
    },

    // ⚙️ SYSTEM ADMINISTRATION
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system preferences, display, and integrations',
      icon: <Settings className="w-8 h-8 text-gray-600" />,
      href: '/modules/settings',
      stats: 'Configure',
      color: 'gray',
      category: 'system'
    },
    {
      id: 'activity',
      title: 'Activity Log',
      description: 'Monitor system activities, user actions, and audit trail',
      icon: <Activity className="w-8 h-8 text-slate-600" />,
      href: '/modules/activity',
      stats: 'Real-time',
      color: 'slate',
      category: 'system'
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

      {/* Module Categories */}
      {['operational', 'customers', 'analytics', 'operations', 'finance', 'system'].map((category) => {
        const categoryModules = modules.filter(module => module.category === category)
        if (categoryModules.length === 0) return null

        const categoryTitles = {
          operational: '🔄 Daily Operations',
          customers: '👥 Customer & Staff',
          analytics: '📊 Business Intelligence',
          operations: '📅 Operations & Scheduling',
          finance: '💰 Financial Management',
          system: '⚙️ System Administration'
        }

        return (
          <div key={category}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categoryModules.map((module) => (
                <Card
                  key={module.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(module.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${module.color}-50 rounded-lg group-hover:bg-${module.color}-100 transition-colors`}>
                          {module.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.title}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1 font-medium">
                            {module.stats}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {module.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
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
        )
      })}

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