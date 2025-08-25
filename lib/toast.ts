/**
 * Simple toast notification system
 * This is a lightweight implementation to replace the missing toast library
 */

interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

class ToastService {
  private container: HTMLElement | null = null

  private getContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'toast-container'
      this.container.className = 'fixed top-4 right-4 z-[9999] space-y-2'
      document.body.appendChild(this.container)
    }
    return this.container
  }

  private show(message: string, options: ToastOptions = {}) {
    const { duration = 4000, type = 'info' } = options
    
    const toast = document.createElement('div')
    toast.className = `
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto 
      flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 
      translate-x-full opacity-0
    `

    const colors = {
      success: 'border-l-4 border-green-500',
      error: 'border-l-4 border-red-500',
      warning: 'border-l-4 border-yellow-500',
      info: 'border-l-4 border-blue-500'
    }

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }

    toast.className += ` ${colors[type]}`

    toast.innerHTML = `
      <div class="flex-1 w-0 p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-lg">${icons[type]}</span>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">${message}</p>
          </div>
        </div>
      </div>
      <div class="flex border-l border-gray-200">
        <button class="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500">
          ✕
        </button>
      </div>
    `

    // Add click to dismiss
    const dismissButton = toast.querySelector('button')
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        this.dismiss(toast)
      })
    }

    const container = this.getContainer()
    container.appendChild(toast)

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0')
    })

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(toast)
    }, duration)
  }

  private dismiss(toast: HTMLElement) {
    toast.classList.add('translate-x-full', 'opacity-0')
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }

  success(message: string, duration?: number) {
    this.show(message, { type: 'success', duration })
  }

  error(message: string, duration?: number) {
    this.show(message, { type: 'error', duration })
  }

  warning(message: string, duration?: number) {
    this.show(message, { type: 'warning', duration })
  }

  info(message: string, duration?: number) {
    this.show(message, { type: 'info', duration })
  }

  // Payment-specific toast methods
  payment = {
    completed: (method: string, amount: number, details?: any) => {
      const message = `Betaling gennemført: ${amount} kr via ${method}`
      this.success(message, 5000)
      
      if (details?.changeGiven && details.changeGiven > 0) {
        setTimeout(() => {
          this.info(`Byttepenge: ${details.changeGiven} kr`, 4000)
        }, 500)
      }
    }
  }
}

export const showToast = new ToastService()

// Export individual methods for convenience
export const toast = {
  success: (message: string) => showToast.success(message),
  error: (message: string) => showToast.error(message),
  warning: (message: string) => showToast.warning(message),
  info: (message: string) => showToast.info(message)
}
