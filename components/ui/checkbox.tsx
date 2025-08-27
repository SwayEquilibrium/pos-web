'use client'

import * as React from "react"
import { Check } from "lucide-react"

export interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={`
          inline-flex items-center justify-center w-4 h-4 border border-gray-300 rounded
          ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}
          ${className}
        `}
        {...props}
      >
        {checked && <Check size={12} />}
      </button>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
