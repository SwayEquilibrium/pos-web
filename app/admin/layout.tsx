'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentCompany } from '@/hooks/useCompany'

interface SidebarItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: string
  submenu?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    href: '/admin'
  },
  {
    id: 'economy',
    label: 'Økonomi',
    icon: '💰',
    href: '/admin/economy',
    submenu: [
      { id: 'reports', label: 'Rapport', icon: '📈', href: '/admin/economy/reports' },
      { id: 'accounting', label: 'Kasseopstelling', icon: '🧮', href: '/admin/economy/accounting' },
    ]
  },
  {
    id: 'sales',
    label: 'Salg',
    icon: '🛒',
    href: '/admin/sales'
  },
  {
    id: 'inventory',
    label: 'Gavekort',
    icon: '🎁',
    href: '/admin/inventory'
  },
  { 
    id: 'menu-management',
    label: 'Menukort',
    icon: '🍽️',
    href: '/admin/menu',
    submenu: [
      { id: 'categories-products', label: 'Kategorier & Produkter', icon: '📋', href: '/admin/settings/menu' },
      { id: 'modifiers', label: 'Tilvalg & Varianter', icon: '🏷️', href: '/admin/settings/modifiers' },
      { id: 'product-modifiers', label: 'Produkt Tilvalg', icon: '🔗', href: '/admin/settings/product-modifiers' },
    ]
  },
  { 
    id: 'operations',
    label: 'Drift',
    icon: '🏪',
    href: '/admin/operations',
    submenu: [
      { id: 'tables', label: 'Borde & Lokaler', icon: '🪑', href: '/admin/settings/tables' },
      { id: 'printers', label: 'Printere', icon: '🖨️', href: '/admin/settings/printers' },
      { id: 'payment', label: 'Betalingsmetoder', icon: '💳', href: '/admin/settings/payment' },
    ]
  },
  { 
    id: 'system',
    label: 'System',
    icon: '⚙️',
    href: '/admin/system',
    submenu: [
      { id: 'display', label: 'Skærm Layout', icon: '📱', href: '/admin/settings/display' },
      { id: 'users', label: 'Brugere', icon: '👥', href: '/admin/settings/users' },
      { id: 'account', label: 'Virksomhed', icon: '🏢', href: '/admin/settings/account' },
      { id: 'activity', label: 'Aktivitetslog', icon: '📝', href: '/admin/settings/activity' },
      { id: 'moms', label: 'Moms & Regnskab', icon: '📋', href: '/admin/settings/moms' },
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        {/* Header */}
        <div className="p-4 border-b">
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
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span>🏠</span>
            Tilbage til POS
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
