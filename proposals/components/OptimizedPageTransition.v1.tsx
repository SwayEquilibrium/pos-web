'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface OptimizedPageTransitionProps {
  children: React.ReactNode
}

export default function OptimizedPageTransition({ children }: OptimizedPageTransitionProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    // Only animate if pathname actually changed
    if (previousPathname.current !== pathname) {
      setIsAnimating(true)
      setIsVisible(false)
      
      // Very fast transition - restaurant staff need speed
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(false)
      }, 50) // Reduced from 150ms to 50ms

      previousPathname.current = pathname
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <div className="relative">
      {/* Minimal loading state - only show for longer transitions */}
      {isAnimating && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary animate-pulse" />
        </div>
      )}
      
      {/* Page content with optimized transition */}
      <div 
        className={`transition-opacity duration-75 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-90'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
