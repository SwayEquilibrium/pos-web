'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Start transition
    setIsLoading(true)
    setIsVisible(false)
    
    // Quick transition - don't want to slow down a busy restaurant
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Page content with smooth transition */}
      <div 
        className={`transition-all duration-200 ease-out ${
          isVisible 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-2'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
