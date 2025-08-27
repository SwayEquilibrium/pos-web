'use client'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  titleClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export default function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = '',
  titleClassName = '',
  contentClassName = '',
  icon,
  badge
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-lg bg-white ${className}`}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full justify-start p-4 h-auto hover:bg-gray-50 ${titleClassName}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            {icon && <div className="text-gray-600">{icon}</div>}
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {badge && <div>{badge}</div>}
        </div>
      </Button>
      
      {isOpen && (
        <div className={`px-4 pb-4 border-t border-gray-100 ${contentClassName}`}>
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
