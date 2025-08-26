'use client'
import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PrimaryButtonProps extends ButtonProps {
  loading?: boolean
}

export function PrimaryButton({ 
  children, 
  loading = false,
  className,
  disabled,
  ...props 
}: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        loading && "opacity-80",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </Button>
  )
}

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "border-2 hover:border-primary hover:text-primary",
        "font-medium transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

export function DangerButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="destructive"
      className={cn(
        "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        "font-medium transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}
