'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AddModifierItemModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  onAdd: (groupId: string, name: string, price: number) => void
}

export default function AddModifierItemModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  onAdd
}: AddModifierItemModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('0')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(groupId, name, parseFloat(price) || 0)
    setName('')
    setPrice('0')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Modifier to {groupName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price Adjustment</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Modifier</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



