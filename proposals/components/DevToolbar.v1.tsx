'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DynamicFlagToggler } from './DynamicFlagToggler.v1'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'

interface DevToolbarProps {
  className?: string
  showByDefault?: boolean
}

export function DevToolbar({ className, showByDefault = false }: DevToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(showByDefault)

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {isExpanded ? (
        <div className="bg-background border rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium text-sm">Dev Tools</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <DynamicFlagToggler compact />
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="shadow-lg"
        >
          <Settings className="h-4 w-4 mr-2" />
          Dev Tools
          <ChevronUp className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  )
}
