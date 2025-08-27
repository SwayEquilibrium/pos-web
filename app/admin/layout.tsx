'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentCompany } from '@/hooks/useCompany'
import { useTranslation } from '@/contexts/LanguageContext'

interface SidebarItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: string
  submenu?: SidebarItem[]
}

const getSidebarItems = (t: (key: string) => string): SidebarItem[] => [
  {
    id: 'dashboard',
    label: t('dashboard'),
    icon: '📊',
    href: '/admin'
  },
  {
    id: 'business',
    label: t('business'),
    icon: '🏢',
    href: '/admin/business',
    submenu: [
      { id: 'company-settings', label: t('companySettings'), icon: '🏢', href: '/admin/business/settings' },
      { id: 'users', label: t('users'), icon: '👥', href: '/admin/business/users' },
      { id: 'customer-groups', label: t('customerGroups'), icon: '👥', href: '/admin/business/groups' },
    ]
  },
  { 
    id: 'menu-management',
    label: t('menuManagement'),
    icon: '🍽️',
    href: '/menu',
    submenu: [
      { id: 'menu-editor', label: 'Menu Editor', icon: '📝', href: '/menu' },
      { id: 'addons-modifiers', label: 'Addons & Modifiers', icon: '🏷️', href: '/modules/menu' },
    ]
  },
  { 
    id: 'operations',
    label: t('operations'),
    icon: '🏪',
    href: '/admin/operations',
    submenu: [
      { id: 'tables', label: t('tablesRooms'), icon: '🪑', href: '/admin/operations/tables' },
      { id: 'shifts', label: t('shifts'), icon: '⏰', href: '/admin/operations/shifts' },
      { id: 'booking', label: t('booking'), icon: '📅', href: '/admin/operations/booking' },
    ]
  },
  {
    id: 'sales',
    label: t('sales'),
    icon: '🛒',
    href: '/admin/sales',
    submenu: [
      { id: 'gift-cards', label: t('giftCards'), icon: '🎁', href: '/admin/sales/gift-cards' },
      { id: 'test-payments', label: t('testPayments'), icon: '🧪', href: '/admin/sales/test-payments' },
    ]
  },
  {
    id: 'economy',
    label: t('economy'),
    icon: '💰',
    href: '/admin/economy',
    submenu: [
      { id: 'reports', label: t('reports'), icon: '📈', href: '/admin/economy/reports' },
      { id: 'accounting', label: t('accounting'), icon: '🧮', href: '/admin/economy/accounting' },
      { id: 'vat-accounting', label: t('vatAccounting'), icon: '📋', href: '/admin/economy/vat' },
    ]
  },
  { 
    id: 'system',
    label: t('system'),
    icon: '⚙️',
    href: '/admin/system',
    submenu: [
      { id: 'display', label: t('screenLayout'), icon: '📱', href: '/admin/system/display' },
      { id: 'payment', label: t('paymentMethods'), icon: '💳', href: '/admin/system/payment' },
      { id: 'printers', label: t('printers'), icon: '🖨️', href: '/admin/system/printers' },
      { id: 'activity', label: t('activityLog'), icon: '📝', href: '/admin/system/activity' },
    ]
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['settings'])
  const { data: company, error: companyError } = useCurrentCompany()
  const { t } = useTranslation()
  
  // Log company fetch issues in development only
  if (companyError && process.env.NODE_ENV === 'development') {
    console.warn('Company fetch failed, using fallback name')
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = isActive(item.href)

    const handleItemClick = (e: React.MouseEvent) => {
      if (hasSubmenu) {
        e.preventDefault()
        toggleExpanded(item.id)
      }
    }

    return (
      <div key={item.id}>
        <div className="flex items-center">
          {hasSubmenu ? (
            // Menu item with submenu - clickable to expand/collapse
            <div
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                level > 0 ? 'ml-6' : ''
              } ${
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
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
              <span className={`ml-auto transition-transform text-blue-600 ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </div>
          ) : (
            // Regular menu item - link to page
            <Link
              href={item.href}
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                level > 0 ? 'ml-6' : ''
              } ${
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
        </div>
        {hasSubmenu && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.submenu!.map(subItem => renderSidebarItem(subItem, level + 1))}
          </div>
        )}
      </div>
    )
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
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setExpandedItems(prev => prev.filter(id => id !== 'mobile-menu'))}>
          <div className="w-80 max-w-[90vw] h-full bg-card border-r" onClick={(e) => e.stopPropagation()}>
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
              {getSidebarItems(t).map(item => renderSidebarItem(item))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToOverview')}
              </Link>
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
          {getSidebarItems(t).map(item => renderSidebarItem(item))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{t('backToOverview')}</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="min-h-full">
          {children}
        </div>
      </div>
    </div>
  )
}
