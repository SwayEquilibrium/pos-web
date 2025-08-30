'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: ConfirmDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



