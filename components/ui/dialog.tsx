"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open: open || false, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange?: (open: boolean) => void
}>({
  open: false
})

const DialogTrigger: React.FC<DialogTriggerProps> = ({ 
  children, 
  onClick, 
  asChild,
  ...props 
}) => {
  const { onOpenChange } = React.useContext(DialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    onOpenChange?.(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: handleClick
    })
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  const { open, onOpenChange } = React.useContext(DialogContext)

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] scroll-container",
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0",
      className
    )}
    {...props}
  />
)

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0",
      className
    )}
    {...props}
  />
)

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
)

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
)

const DialogClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  onClick,
  ...props
}) => {
  const { onOpenChange } = React.useContext(DialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    onOpenChange?.(false)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}