// Mock modifier hooks for the order system
// These replace the database-based modifier hooks with mock data

import { useState, useEffect } from 'react'
import { getMockProductModifiers, type MockProductModifier } from '@/lib/mockModifiers'

export interface SelectedModifier {
  modifier_id: string
  modifier_name: string
  price_adjustment: number
}

// Mock version of useProductModifiers that uses our mock data
export function useMockProductModifiers(productId?: string) {
  const [data, setData] = useState<MockProductModifier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      setData([])
      setIsLoading(false)
      return
    }

    // Simulate async loading
    setIsLoading(true)
    const timer = setTimeout(() => {
      const modifiers = getMockProductModifiers(productId)
      setData(modifiers)
      setIsLoading(false)
      console.log(`[useMockProductModifiers] Loaded ${modifiers.length} modifiers for product ${productId}`)
    }, 100)

    return () => clearTimeout(timer)
  }, [productId])

  return { data, isLoading }
}

// Helper function to group modifiers by their groups (same as original)
export function groupModifiersByGroup(productModifiers: MockProductModifier[]): Record<string, MockProductModifier[]> {
  return productModifiers.reduce((groups, modifier) => {
    const groupId = modifier.group_id
    if (!groups[groupId]) {
      groups[groupId] = []
    }
    groups[groupId].push(modifier)
    return groups
  }, {} as Record<string, MockProductModifier[]>)
}

// Helper function to calculate item price (same as original)
export function calculateItemPrice(basePrice: number, selectedModifiers: SelectedModifier[]): number {
  return selectedModifiers.reduce((total, modifier) => {
    return total + modifier.price_adjustment
  }, basePrice)
}
