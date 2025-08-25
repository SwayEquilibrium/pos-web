'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  BarChart3, 
  Users, 
  Building2, 
  Gift, 
  CreditCard, 
  Layout, 
  User, 
  ClipboardList, 
  Package,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Home
} from 'lucide-react'

interface SidebarItem {
  id: string
  name: string
  path?: string
  icon?: React.ReactNode
  badge?: string
  children?: SidebarItem[]
}

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['menu-administration'])

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/modules',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'bordreservation',
      name: 'Bordreservation',
      path: '/admin/booking',
      icon: <Calendar className="w-4 h-4" />,
      badge: 'NY'
    },
    {
      id: 'vagtplan',
      name: 'Vagtplan',
      path: '/admin/shifts',
      icon: <Clock className="w-4 h-4" />,
      badge: 'NY'
    },
    {
      id: 'menu-administration',
      name: 'Menu Administration',
      icon: <Package className="w-4 h-4" />,
      children: [
        {
          id: 'categories-products',
          name: 'Kategorier & Produkter',
          path: '/admin/settings/menu',
          icon: <Package className="w-4 h-4" />
        },
        {
          id: 'tilvalg-varianter',
          name: 'Tilvalg & Varianter',
          path: '/admin/settings/modifiers',
          icon: <Settings className="w-4 h-4" />
        },
        {
          id: 'produkt-tilvalg',
          name: 'Produkt Tilvalg',
          path: '/admin/settings/product-modifiers',
          icon: <ClipboardList className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'drift-lokaler',
      name: 'Drift & Lokaler',
      path: '/admin/settings/tables',
      icon: <Layout className="w-4 h-4" />
    },
    {
      id: 'bruger-administration',
      name: 'Bruger Administration',
      path: '/admin/settings/users',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'gavekort',
      name: 'Gavekort',
      path: '/admin/settings/gift-cards',
      icon: <Gift className="w-4 h-4" />
    },
    {
      id: 'system-indstillinger',
      name: 'System & Indstillinger',
      icon: <Settings className="w-4 h-4" />,
      children: [
        {
          id: 'display-settings',
          name: 'Skærmlayout',
          path: '/admin/settings/display',
          icon: <Layout className="w-4 h-4" />
        },
        {
          id: 'activity-log',
          name: 'Aktivitetslog',
          path: '/admin/settings/activity',
          icon: <ClipboardList className="w-4 h-4" />
        },
        {
          id: 'payment-settings',
          name: 'Betalingsindstillinger',
          path: '/admin/settings/payment',
          icon: <CreditCard className="w-4 h-4" />
        }
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

  const isActive = (path: string) => {
    if (path === '/modules') {
      return pathname === '/modules'
    }
    return pathname.startsWith(path)
  }

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = item.path ? isActive(item.path) : false

    return (
      <div key={item.id}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={`w-full justify-start text-left h-auto py-3 px-3 ${
            level > 0 ? 'ml-6 text-sm' : ''
          } ${active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'hover:bg-muted/50'}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else if (item.path) {
              router.push(item.path)
            }
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                  {item.badge}
                </Badge>
              )}
            </div>
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </Button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Fixed */}
      <div className="w-80 bg-card border-r flex flex-col fixed h-full z-10">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Hjem
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Moduler</h1>
              <p className="text-sm text-muted-foreground">Administration & Indstillinger</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium">System Status</span>
            </div>
            <p className="text-xs text-muted-foreground">Alle moduler er aktive</p>
          </div>
        </div>
      </div>

      {/* Main Content Area - With left margin to account for fixed sidebar */}
      <div className="flex-1 ml-80 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
