'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContextualSaveButtonProps {
  hasChanges: boolean
  onSave: () => void | Promise<void>
  onCancel?: () => void
  isSaving?: boolean
  disabled?: boolean
  saveText?: string
  cancelText?: string
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function ContextualSaveButton({
  hasChanges,
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
  saveText = 'Save Changes',
  cancelText = 'Cancel',
  className,
  position = 'bottom-right'
}: ContextualSaveButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Show/hide based on changes
  useEffect(() => {
    if (hasChanges && !disabled) {
      setIsVisible(true)
    } else if (!justSaved) {
      // Hide immediately if no changes and not in success state
      setIsVisible(false)
    }
  }, [hasChanges, disabled, justSaved])

  // Handle success state visibility
  useEffect(() => {
    if (justSaved) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setJustSaved(false)
        setIsVisible(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [justSaved])

  const handleSave = async () => {
    try {
      await onSave()
      setJustSaved(true)
      // Success state and hiding is now handled by useEffect
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      positionClasses[position],
      'z-50 flex items-center gap-2 bg-background border rounded-lg shadow-lg p-2',
      className
    )}>
      {justSaved ? (
        <div className="flex items-center gap-2 text-green-600 px-3 py-2">
          <Check size={16} />
          <span className="text-sm font-medium">Saved!</span>
        </div>
      ) : (
        <>
          <Button
            onClick={handleSave}
            disabled={isSaving || disabled}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : saveText}
          </Button>
          
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              <X size={16} className="mr-2" />
              {cancelText}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// Hook to track form changes
export function useFormChanges<T extends Record<string, any>>(
  originalData: T | null,
  currentData: T,
  compareKeys?: (keyof T)[]
): {
  hasChanges: boolean
  changedFields: (keyof T)[]
  resetChanges: () => void
} {
  const [resetTrigger, setResetTrigger] = useState(0)

  // Memoize the comparison result to avoid infinite loops
  const { hasChanges, changedFields } = useMemo(() => {
    if (!originalData) {
      return { hasChanges: false, changedFields: [] as (keyof T)[] }
    }

    const keysToCompare = compareKeys || Object.keys(currentData) as (keyof T)[]
    const changed: (keyof T)[] = []

    for (const key of keysToCompare) {
      if (originalData[key] !== currentData[key]) {
        changed.push(key)
      }
    }

    return {
      hasChanges: changed.length > 0,
      changedFields: changed
    }
  }, [originalData, currentData, compareKeys, resetTrigger])

  const resetChanges = useCallback(() => {
    setResetTrigger(prev => prev + 1)
  }, [])

  return { hasChanges, changedFields, resetChanges }
}
