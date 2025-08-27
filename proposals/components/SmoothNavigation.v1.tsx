'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavigationState {
  isTransitioning: boolean
  targetPath: string | null
  progress: number
}

interface NavigationContextType {
  state: NavigationState
  navigate: (path: string) => Promise<void>
  prefetchRoute: (path: string) => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function SmoothNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<NavigationState>({
    isTransitioning: false,
    targetPath: null,
    progress: 0
  })

  // Prefetch routes for instant navigation
  const prefetchRoute = useCallback((path: string) => {
    if (path !== pathname) {
      router.prefetch(path)
    }
  }, [router, pathname])

  // Smooth navigation with immediate visual feedback
  const navigate = useCallback(async (path: string) => {
    if (path === pathname || state.isTransitioning) {
      return
    }

    // Start transition immediately
    setState({
      isTransitioning: true,
      targetPath: path,
      progress: 0
    })

    // Simulate smooth progress
    const progressInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 20, 90)
      }))
    }, 10)

    try {
      // Navigate immediately (no artificial delay)
      router.push(path)
      
      // Complete progress after a short time
      setTimeout(() => {
        clearInterval(progressInterval)
        setState({
          isTransitioning: false,
          targetPath: null,
          progress: 100
        })
      }, 100)
    } catch (error) {
      clearInterval(progressInterval)
      setState({
        isTransitioning: false,
        targetPath: null,
        progress: 0
      })
      console.error('Navigation failed:', error)
    }
  }, [router, pathname, state.isTransitioning])

  // Reset state when pathname changes
  useEffect(() => {
    if (!state.isTransitioning) return
    
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isTransitioning: false,
        targetPath: null,
        progress: 100
      }))
    }, 50)

    return () => clearTimeout(timer)
  }, [pathname, state.isTransitioning])

  return (
    <NavigationContext.Provider value={{ state, navigate, prefetchRoute }}>
      {children}
      
      {/* Global transition overlay */}
      {state.isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
            <div 
              className="h-full bg-primary transition-all duration-100 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
          
          {/* Loading indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  )
}

export function useSmoothNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useSmoothNavigation must be used within SmoothNavigationProvider')
  }
  return context
}

// Enhanced navigation button component
interface SmoothNavButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'lg' | 'default'
  prefetch?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SmoothNavButton({ 
  href, 
  children, 
  className = '',
  variant = 'default',
  size = 'default',
  prefetch = true,
  disabled = false,
  onClick,
  ...props 
}: SmoothNavButtonProps) {
  const { state, navigate, prefetchRoute } = useSmoothNavigation()
  const pathname = usePathname()
  
  const isActive = pathname === href
  const isTarget = state.targetPath === href
  const isTransitioning = state.isTransitioning

  // Prefetch on hover
  const handleMouseEnter = useCallback(() => {
    if (prefetch && !isActive) {
      prefetchRoute(href)
    }
  }, [prefetch, isActive, href, prefetchRoute])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onClick) {
      onClick(e)
    }
    
    if (!disabled && !isActive) {
      navigate(href)
    }
  }, [disabled, isActive, href, navigate, onClick])

  // Base button styles
  const baseClasses = `
    relative overflow-hidden transition-all duration-200 ease-out cursor-pointer
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    ${isActive ? 'scale-105 shadow-lg' : 'hover:scale-[1.02] hover:shadow-md'}
    ${isTarget && isTransitioning ? 'animate-pulse scale-105' : ''}
    ${isTransitioning && !isTarget ? 'opacity-70 scale-[0.98]' : ''}
  `

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || isTransitioning}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {/* Shimmer effect for active navigation */}
      {isTarget && isTransitioning && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      
      {children}
      
      {/* Progress indicator for target */}
      {isTarget && isTransitioning && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/50 transition-all duration-100"
             style={{ width: `${state.progress}%` }} />
      )}
    </button>
  )
}

// Custom keyframes for shimmer effect
const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`

// Inject keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shimmerKeyframes
  document.head.appendChild(style)
}
