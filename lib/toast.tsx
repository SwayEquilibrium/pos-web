// Simple toast notification system
import React from 'react'

export interface ToastOptions {
  duration?: number
  position?: 'top' | 'bottom'
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

// Global toast state
let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// Notify listeners
const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]))
}

// Add toast
const addToast = (message: string, type: Toast['type'], options: ToastOptions = {}) => {
  const toast: Toast = {
    id: generateId(),
    message,
    type,
    duration: options.duration || 4000
  }

  toasts.push(toast)
  notifyListeners()

  // Auto remove
  setTimeout(() => {
    removeToast(toast.id)
  }, toast.duration)

  return toast.id
}

// Remove toast
const removeToast = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id)
  notifyListeners()
}

// Subscribe to toast changes
export const subscribeToToasts = (listener: (toasts: Toast[]) => void) => {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

// Toast functions
export const showToast = {
  success: (message: string, options?: ToastOptions) => addToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => addToast(message, 'error', options),
  info: (message: string, options?: ToastOptions) => addToast(message, 'info', options),
  warning: (message: string, options?: ToastOptions) => addToast(message, 'warning', options),
  settings: {
    saved: (item: string) => addToast(`${item} saved successfully!`, 'success')
  }
}

// React component for displaying toasts
export const CustomToaster: React.FC = () => {
  const [currentToasts, setCurrentToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    const unsubscribe = subscribeToToasts(setCurrentToasts)
    return unsubscribe
  }, [])

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out
            ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-500 text-black' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
