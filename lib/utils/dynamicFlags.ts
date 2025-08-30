// Dynamic Feature Flags v1.0
// Allows runtime flag toggling without server restart

import { FeatureFlags } from '@/src/config/flags'

const STORAGE_KEY = 'pos-dynamic-flags-v1'

export interface DynamicFlagOverrides extends Partial<FeatureFlags> {
  _enabled?: boolean // Master switch for dynamic flags
}

// Get current overrides from localStorage
export function getDynamicOverrides(): DynamicFlagOverrides {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Set flag overrides in localStorage
export function setDynamicOverrides(overrides: DynamicFlagOverrides): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
    // Trigger a custom event for components to listen to
    window.dispatchEvent(new CustomEvent('flagsChanged', { detail: overrides }))
  } catch (error) {
    console.warn('Failed to save dynamic flags:', error)
  }
}

// Toggle a specific flag
export function toggleFlag(flagName: keyof FeatureFlags, value?: boolean): void {
  const current = getDynamicOverrides()
  const newValue = value !== undefined ? value : !current[flagName]
  
  setDynamicOverrides({
    ...current,
    _enabled: true,
    [flagName]: newValue
  })
}

// Clear all overrides (revert to env flags)
export function clearDynamicOverrides(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('flagsChanged', { detail: {} }))
}

// Merge environment flags with dynamic overrides
export function mergeFlags(envFlags: FeatureFlags): FeatureFlags {
  const overrides = getDynamicOverrides()
  
  // If dynamic flags are disabled, return env flags as-is
  if (!overrides._enabled) {
    return envFlags
  }
  
  // Merge with overrides taking precedence
  return {
    ...envFlags,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== '_enabled')
    )
  } as FeatureFlags
}

// React hook for dynamic flags
export function useDynamicFlags(envFlags: FeatureFlags) {
  const [flags, setFlags] = React.useState(() => mergeFlags(envFlags))
  
  React.useEffect(() => {
    const handleFlagsChanged = () => {
      setFlags(mergeFlags(envFlags))
    }
    
    window.addEventListener('flagsChanged', handleFlagsChanged)
    return () => window.removeEventListener('flagsChanged', handleFlagsChanged)
  }, [envFlags])
  
  return flags
}

// Export React for the hook (will be imported where needed)
import React from 'react'
