'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Table, 
  ShoppingBag, 
  Settings, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export default function GlobalNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const navigationItems = [
    {
      id: 'home',
      label: 'Main',
      icon: <Home className="w-4 h-4" />,
      href: '/',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: <Table className="w-4 h-4" />,
      href: '/tables',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'takeaway',
      label: 'Takeaway',
      icon: <ShoppingBag className="w-4 h-4" />,
      href: '/takeaway',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: <Settings className="w-4 h-4" />,
      href: '/modules',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  const getCurrentPageName = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname === '/tables') return 'Tables'
    if (pathname === '/takeaway') return 'Takeaway'
    if (pathname === '/modules') return 'Modules'
    if (pathname.startsWith('/admin')) return 'Admin'
    if (pathname.startsWith('/orders')) return 'Orders'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'POS System'
  }

  const handleNavigation = (href: string) => {
    // Don't navigate if already on the page
    if (pathname === href) {
      setShowMobileMenu(false)
      return
    }
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      router.push(href)
      setShowMobileMenu(false)
    }, 50)
  }

  return (
    <>
      {/* Fixed Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          {/* Left: Current Page Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">🥩</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-gray-900">{getCurrentPageName()}</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>POS System</span>
                <ChevronRight className="w-3 h-3" />
                <span>{getCurrentPageName()}</span>
              </div>
            </div>
            <div className="sm:hidden">
              <h1 className="font-semibold text-gray-900 text-sm">{getCurrentPageName()}</h1>
            </div>
          </div>

          {/* Center: Quick Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`h-9 px-3 text-white transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 ${item.color} ${
                  pathname === item.href ? 'ring-2 ring-offset-1 ring-gray-400 shadow-lg' : 'hover:shadow-md'
                }`}
                size="sm"
              >
                {item.icon}
                <span className="ml-1.5 text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Right: Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="h-9 w-9 p-0"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Right: Status Badge (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Online
            </Badge>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('da-DK', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full justify-start h-10 text-white transition-all ${item.color} ${
                    pathname === item.href ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  variant="default"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                  {pathname === item.href && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Current
                    </Badge>
                  )}
                </Button>
              ))}
              
              {/* Mobile Status */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t">
                <Badge variant="outline" className="text-xs">
                  Online
                </Badge>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('da-DK', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from hiding under fixed nav */}
      <div className="h-16 md:h-14"></div>
    </>
  )
}
