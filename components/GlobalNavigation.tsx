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
import { useState, useEffect } from 'react'

export default function GlobalNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)

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

  const handleNavigation = async (href: string) => {
    // Don't navigate if already on the page
    if (pathname === href || isTransitioning) {
      setShowMobileMenu(false)
      return
    }
    
    // Start smooth transition
    setIsTransitioning(true)
    setTargetPath(href)
    setShowMobileMenu(false)
    
    // Add transition delay for smooth animation
    setTimeout(() => {
      router.push(href)
      // Reset transition state after navigation
      setTimeout(() => {
        setIsTransitioning(false)
        setTargetPath(null)
      }, 150)
    }, 150)
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
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const isTargeted = targetPath === item.href
              
              return (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isTransitioning}
                  className={`h-9 px-3 text-white transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${item.color} ${
                    isActive ? 'ring-2 ring-offset-1 ring-gray-400 shadow-lg scale-105' : 'hover:shadow-md'
                  } ${
                    isTargeted ? 'animate-pulse scale-105' : ''
                  } ${
                    isTransitioning && !isTargeted ? 'opacity-60 scale-95' : ''
                  }`}
                  size="sm"
                >
                  {isTargeted && isTransitioning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    item.icon
                  )}
                  <span className="ml-1.5 text-sm">{item.label}</span>
                </Button>
              )
            })}
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
              {navigationItems.map((item, index) => {
                const isActive = pathname === item.href
                const isTargeted = targetPath === item.href
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    disabled={isTransitioning}
                    className={`w-full justify-start h-10 text-white transition-all duration-300 ${item.color} ${
                      isActive ? 'ring-2 ring-offset-1 ring-gray-400 scale-105' : 'hover:scale-[1.02]'
                    } ${
                      isTargeted ? 'animate-pulse' : ''
                    } ${
                      isTransitioning && !isTargeted ? 'opacity-60' : ''
                    }`}
                    variant="default"
                  >
                    {isTargeted && isTransitioning ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      item.icon
                    )}
                    <span className="ml-2">{item.label}</span>
                    {isActive && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Current
                      </Badge>
                    )}
                  </Button>
                )
              })}
              
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
