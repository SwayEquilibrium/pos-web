'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonProps } from '@/components/ui/button'

interface SmoothButtonProps extends ButtonProps {
  children: React.ReactNode
  loading?: boolean
}

export default function SmoothButton({ 
  children, 
  loading = false, 
  onClick, 
  disabled,
  className = '',
  ...props 
}: SmoothButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading || isLoading) return

    setIsPressed(true)
    setIsLoading(true)

    // Provide immediate visual feedback
    setTimeout(() => setIsPressed(false), 150)

    if (onClick) {
      try {
        await onClick(e)
      } finally {
        // Small delay to prevent flash
        setTimeout(() => setIsLoading(false), 100)
      }
    } else {
      setTimeout(() => setIsLoading(false), 100)
    }
  }

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading || isLoading}
      className={`
        transition-all duration-150 ease-out
        ${isPressed ? 'transform scale-95' : 'transform scale-100'}
        ${isLoading ? 'opacity-80' : 'opacity-100'}
        hover:shadow-md active:shadow-sm
        ${className}
      `}
    >
      {(loading || isLoading) && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
      )}
      {children}
    </Button>
  )
}
