'use client'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUpdateSortOrder, useMoveSortOrder, useAutoSort, reorderItems, type SortItem } from '@/hooks/useSorting'

interface SortableItemProps {
  id: string
  children: React.ReactNode
  disabled?: boolean
}

function SortableItem({ id, children, disabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`relative ${!disabled ? 'cursor-move' : ''}`}>
        {!disabled && (
          <div 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
            {...listeners}
          >
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
        <div className={!disabled ? 'ml-6' : ''}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface SortControlsProps {
  onAutoSort: (sortBy: 'name', direction: 'asc' | 'desc') => void
  isLoading?: boolean
  itemCount: number
}

function SortControls({ onAutoSort, isLoading, itemCount }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>🔀</span>
        <span>Sortering:</span>
      </div>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAutoSort('name', 'asc')}
          disabled={isLoading}
          className="text-xs"
        >
          A→Z
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAutoSort('name', 'desc')}
          disabled={isLoading}
          className="text-xs"
        >
          Z→A
        </Button>
      </div>
      
      <div className="flex-1"></div>
      
      <Badge variant="secondary" className="text-xs">
        {itemCount} elementer
      </Badge>
    </div>
  )
}

interface SortableListProps {
  items: SortItem[]
  table: 'categories' | 'products'
  renderItem: (item: SortItem, index: number) => React.ReactNode
  onItemsReordered?: (items: SortItem[]) => void
  disabled?: boolean
  showControls?: boolean
  className?: string
}

export default function SortableList({
  items,
  table,
  renderItem,
  onItemsReordered,
  disabled = false,
  showControls = true,
  className = ""
}: SortableListProps) {
  const [localItems, setLocalItems] = useState(items)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const updateSortOrder = useUpdateSortOrder()
  const autoSort = useAutoSort()

  // Update local items when props change
  useState(() => {
    setLocalItems(items)
  })

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localItems.findIndex(item => item.id === active.id)
    const newIndex = localItems.findIndex(item => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Update local state immediately for smooth UX
    const reorderedItems = arrayMove(localItems, oldIndex, newIndex)
    const itemsWithUpdatedIndices = reorderedItems.map((item, index) => ({
      ...item,
      sort_index: index + 1
    }))
    
    setLocalItems(itemsWithUpdatedIndices)
    
    // Notify parent component
    if (onItemsReordered) {
      onItemsReordered(itemsWithUpdatedIndices)
    }

    try {
      // Update database
      await updateSortOrder.mutateAsync({
        items: itemsWithUpdatedIndices.map(item => ({
          id: item.id,
          sort_index: item.sort_index
        })),
        table,
        parent_id: items[0]?.parent_id
      })
    } catch (error) {
      console.error('Failed to update sort order:', error)
      // Revert local state on error
      setLocalItems(items)
      alert('Fejl ved opdatering af rækkefølge. Prøv igen.')
    }
  }

  const handleAutoSort = async (sortBy: 'name', direction: 'asc' | 'desc') => {
    try {
      const sortedItems = await autoSort.mutateAsync({
        items: localItems,
        table,
        sortBy,
        direction
      })
      
      setLocalItems(sortedItems)
      
      if (onItemsReordered) {
        onItemsReordered(sortedItems)
      }
    } catch (error) {
      console.error('Failed to auto-sort:', error)
      alert('Fejl ved automatisk sortering. Prøv igen.')
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-2">📋</div>
        <p>Ingen elementer at sortere</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showControls && (
        <SortControls
          onAutoSort={handleAutoSort}
          isLoading={updateSortOrder.isPending || autoSort.isPending}
          itemCount={localItems.length}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localItems.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                disabled={disabled}
              >
                <div className="relative">
                  {renderItem(item, index)}
                  
                  {/* Sort index indicator */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs opacity-60">
                      #{item.sort_index}
                    </Badge>
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {(updateSortOrder.isPending || autoSort.isPending) && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Opdaterer rækkefølge...
          </div>
        </div>
      )}
    </div>
  )
}

// Quick sort buttons component for individual items
interface QuickSortButtonsProps {
  itemId: string
  currentIndex: number
  totalItems: number
  table: 'categories' | 'products'
  allItems: SortItem[]
  onMove?: (direction: 'up' | 'down') => void
}

export function QuickSortButtons({
  itemId,
  currentIndex,
  totalItems,
  table,
  allItems,
  onMove
}: QuickSortButtonsProps) {
  const moveSortOrder = useMoveSortOrder()

  const handleMove = async (direction: 'up' | 'down') => {
    try {
      await moveSortOrder.mutateAsync({
        itemId,
        direction,
        table,
        allItems
      })
      
      if (onMove) {
        onMove(direction)
      }
    } catch (error) {
      console.error('Failed to move item:', error)
      alert('Fejl ved flytning. Prøv igen.')
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleMove('up')}
        disabled={currentIndex === 0 || moveSortOrder.isPending}
        className="h-6 w-6 p-0"
        title="Flyt op"
      >
        ↑
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleMove('down')}
        disabled={currentIndex === totalItems - 1 || moveSortOrder.isPending}
        className="h-6 w-6 p-0"
        title="Flyt ned"
      >
        ↓
      </Button>
    </div>
  )
}
