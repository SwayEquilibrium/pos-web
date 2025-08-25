'use client'
import { Button } from '@/components/ui/button'

interface BackNavigationProps {
  onBack: () => void
  title: string
  breadcrumbs?: Array<{name: string, onClick?: () => void}>
  showBack?: boolean
  className?: string
}

export default function BackNavigation({ 
  onBack, 
  title, 
  breadcrumbs = [], 
  showBack = true,
  className = ""
}: BackNavigationProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {/* Back Arrow */}
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage
          </Button>
        )}
        
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.onClick ? (
                    <button 
                      onClick={item.onClick}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <span>{item.name}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple back button component for single-level navigation
interface SimpleBackButtonProps {
  onBack: () => void
  label?: string
  className?: string
}

export function SimpleBackButton({ 
  onBack, 
  label = "Tilbage", 
  className = "" 
}: SimpleBackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className={`flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Button>
  )
}
