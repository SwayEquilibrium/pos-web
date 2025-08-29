'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useCurrentCompany } from '@/hooks/useCompany'
import { useTranslation } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: string
  component?: React.ComponentType
  badge?: string
  submenu?: SidebarItem[]
}

interface ModulesLayoutProps {
  children: React.ReactNode
}

export default function ModulesLayout({ children }: ModulesLayoutProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['modules'])
  const [activeSection, setActiveSection] = useState<string>('dashboard')
  const [isAnimating, setIsAnimating] = useState(false)
  const { data: company, error: companyError } = useCurrentCompany()
  const { t } = useTranslation()

  // Listen for section change events from child components
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail)
      // Ensure modules section is expanded when menu-editor is active
      if (event.detail === 'menu-editor') {
        setExpandedItems(prev => prev.includes('modules') ? prev : [...prev, 'modules'])
      }
    }

    window.addEventListener('modulesSectionChange', handleSectionChange as EventListener)
    return () => {
      window.removeEventListener('modulesSectionChange', handleSectionChange as EventListener)
    }
  }, [])
  
  // Log company fetch issues in development only
  if (companyError && process.env.NODE_ENV === 'development') {
    console.warn('Company fetch failed, using fallback name')
  }

  const getSidebarItems = (): SidebarItem[] => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      id: 'menu',
      label: 'Menu & Products',
      icon: '🍽️',
      submenu: [
        { id: 'menu-editor', label: 'Menu Editor', icon: '🍽️' },
      ]
    },
    {
      id: 'operations',
      label: t('operations'),
      icon: '🏪',
      submenu: [
        { id: 'orders', label: 'Orders', icon: '🛒' },
        { id: 'tables', label: t('tablesRooms'), icon: '🪑' },
        { id: 'shifts', label: t('shifts'), icon: '⏰' },
        { id: 'booking', label: t('booking'), icon: '📅' },
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: '👥'
    },
    {
      id: 'business',
      label: t('business'),
      icon: '🏢',
      submenu: [
        { id: 'company-settings', label: t('companySettings'), icon: '🏢' },
        { id: 'users', label: t('users'), icon: '👥' },
        { id: 'customer-groups', label: t('customerGroups'), icon: '👥' },
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: '💰',
      submenu: [
        { id: 'gift-cards', label: t('giftCards'), icon: '🎁' },
        { id: 'reports', label: t('reports'), icon: '📈' },
        { id: 'accounting', label: t('accounting'), icon: '🧮' },
        { id: 'vat-accounting', label: t('vatAccounting'), icon: '📋' },
        { id: 'payment', label: t('paymentMethods'), icon: '💳' },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      submenu: [
        { id: 'display', label: t('screenLayout'), icon: '📱' },
        { id: 'payment', label: t('paymentMethods'), icon: '💳' },
        { id: 'printers', label: t('printers'), icon: '🖨️' },

        { id: 'activity', label: t('activityLog'), icon: '📝' },
      ]
    }
  ]

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (sectionId: string) => activeSection === sectionId

  // Render different content based on active section
  const renderContent = () => {
    // Import CustomerGroupsManager dynamically to avoid SSR issues
    const CustomerGroupsManager = dynamic(() => import('@/components/CustomerGroupsManager'), {
      loading: () => <div className="p-6">Loading Customer Groups...</div>
    })
    
    // Content will be rendered based on activeSection
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Overview and analytics</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-2">📊 Analytics</h3>
                <p className="text-sm text-muted-foreground">View performance metrics</p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-2">🛒 Recent Orders</h3>
                <p className="text-sm text-muted-foreground">Latest order activity</p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-2">💰 Revenue</h3>
                <p className="text-sm text-muted-foreground">Financial overview</p>
              </div>
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-2">👥 Users</h3>
                <p className="text-sm text-muted-foreground">Active users today</p>
              </div>
            </div>
          </div>
        )
      case 'menu-editor':
        return children
      case 'customer-groups':
        return (
          <div className="animate-in slide-in-from-right-5 duration-300">
            <CustomerGroupsManager showHeader={true} />
          </div>
        )
      case 'printers':
        // Import PrinterSettings dynamically
        const PrinterSettings = dynamic(() => import('./settings/printers/page'), {
          loading: () => <div className="p-6">Loading Printer Settings...</div>
        })
        return <PrinterSettings />

      case 'tables':
        // Import TableManagement dynamically
        const TableManagement = dynamic(() => import('./operations/tables/page'), {
          loading: () => <div className="p-6">Loading Table Management...</div>
        })
        return <TableManagement />
      case 'orders':
        // Import OrdersOverview dynamically
        const OrdersOverview = dynamic(() => import('@/components/modules/OrdersOverview'), {
          loading: () => <div className="p-6">Loading Orders...</div>
        })
        return <OrdersOverview />
      case 'activity':
        // Import ActivityLogs dynamically
        const ActivityLogs = dynamic(() => import('@/app/settings/components/ActivityLogs'), {
          loading: () => <div className="p-6">Loading Activity Logs...</div>
        })
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Log</h2>
              <p className="text-gray-600">View all system activities and changes</p>
            </div>
            <ActivityLogs />
          </div>
        )
      case 'users':
        // TODO: Create a shared UserManagement component
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>User Management - Coming soon (will be integrated from existing page)</p>
          </div>
        )
      case 'company-settings':
        // Import BusinessSettings dynamically
        const BusinessSettings = dynamic(() => import('./business/settings/page'), {
          loading: () => <div className="p-6">Loading Company Settings...</div>
        })
        return <BusinessSettings />
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Content for "{activeSection}" coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">🥩</span>
            </div>
            <span className="font-semibold text-gray-900">Modules</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {getSidebarItems().map((item) => (
            <div key={item.id} className="space-y-1">
              {/* Main menu item */}
              <div className="relative">
                <Button
                  variant={isActive(item.id) ? "default" : "ghost"}
                  className={`w-full justify-between h-10 ${
                    isActive(item.id) ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (item.submenu) {
                      toggleExpanded(item.id)
                    } else {
                      setActiveSection(item.id)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.submenu && (
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedItems.includes(item.id) ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Button>
              </div>

              {/* Dropdown submenu */}
              {item.submenu && expandedItems.includes(item.id) && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
                  {item.submenu.map((subItem) => (
                    <Button
                      key={subItem.id}
                      variant={isActive(subItem.id) ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start h-8 text-sm ${
                        isActive(subItem.id) ? 'bg-primary/80 text-primary-foreground' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveSection(subItem.id)}
                    >
                      <span className="text-sm mr-2">{subItem.icon}</span>
                      {subItem.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}