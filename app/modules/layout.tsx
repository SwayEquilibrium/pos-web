'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useCurrentCompany } from '@/hooks/useCompany'
import { useTranslation } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
      label: t('system'),
      icon: '⚙️',
      submenu: [
        { id: 'display', label: t('screenLayout'), icon: '📱' },
        { id: 'printers', label: t('printers'), icon: '🖨️' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'activity', label: t('activityLog'), icon: '📝' },
        { id: 'test-payments', label: t('testPayments'), icon: '🧪' },
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

  const handleSectionChange = async (sectionId: string) => {
    if (sectionId === activeSection) return
    
    setIsAnimating(true)
    
    // Small delay for smooth transition
    setTimeout(() => {
      setActiveSection(sectionId)
      setIsAnimating(false)
    }, 150)
  }

  const isActive = (itemId: string) => {
    return activeSection === itemId
  }

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = isActive(item.id)

    const handleItemClick = (e: React.MouseEvent) => {
      e.preventDefault()
      if (hasSubmenu) {
        toggleExpanded(item.id)
      } else {
        handleSectionChange(item.id)
      }
    }

    return (
      <div key={item.id} className="transition-all duration-200">
        <div className="flex items-center">
          <div
            className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
              level > 0 ? 'ml-6' : ''
            } ${
              active 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground transform hover:scale-[1.02]'
            }`}
            onClick={handleItemClick}
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
            {hasSubmenu && (
              <span className={`ml-auto transition-transform duration-200 text-blue-600 ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            )}
          </div>
        </div>
        {hasSubmenu && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="mt-1 space-y-1">
              {item.submenu!.map(subItem => renderSidebarItem(subItem, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">🥩</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {company?.name || 'POS System'}
            </h2>
            <p className="text-xs text-muted-foreground">Back Office</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedItems(prev => prev.includes('mobile-menu') ? prev.filter(id => id !== 'mobile-menu') : [...prev, 'mobile-menu'])}
          className="lg:hidden"
        >
          {expandedItems.includes('mobile-menu') ? '✕' : '☰'}
        </Button>
      </div>

      {/* Mobile Navigation Overlay */}
      {expandedItems.includes('mobile-menu') && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" onClick={() => setExpandedItems(prev => prev.filter(id => id !== 'mobile-menu'))}>
          <div className="w-80 max-w-[90vw] h-full bg-card border-r animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">🥩</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">
                      {company?.name || 'POS System'}
                    </h2>
                    <p className="text-xs text-muted-foreground">Back Office</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedItems(prev => prev.filter(id => id !== 'mobile-menu'))}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {getSidebarItems().map(item => renderSidebarItem(item))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToOverview')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 border-r bg-card relative">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">🥩</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-sm truncate">
                {company?.name || 'POS System'}
              </h2>
              <p className="text-xs text-muted-foreground">Back Office</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {getSidebarItems().map(item => renderSidebarItem(item))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{t('backToOverview')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className={`min-h-full transition-all duration-300 ease-in-out ${
          isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
        }`}>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}