'use client'
import React from 'react'

interface MoneyProps {
  amount: number // Amount in øre (minor units)
  currency?: string
  className?: string
  showCurrency?: boolean
}

/**
 * Money component that handles currency formatting
 * Expects amount in minor units (øre for DKK)
 * 1 DKK = 100 øre
 */
export function Money({ 
  amount, 
  currency = 'DKK', 
  className = '',
  showCurrency = true 
}: MoneyProps) {
  // Convert øre to DKK
  const formatted = (amount / 100).toFixed(2)
  
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatted} {showCurrency && 'kr'}
    </span>
  )
}

// Helper function to convert DKK to øre
export function dkkToOre(dkk: number): number {
  return Math.round(dkk * 100)
}

// Helper function to convert øre to DKK  
export function oreToDkk(ore: number): number {
  return ore / 100
}
