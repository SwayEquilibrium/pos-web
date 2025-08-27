'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react'

interface SortableItem {
  id: string
  name: string
  sort_index: number
  [key: string]: any
}

interface SortListProps<T extends SortableItem> {
  items: T[]
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  renderItem?: (item: T, index: number) => React.ReactNode
  className?: string
  showIndexes?: boolean
  isLoading?: boolean
}

export default function SortList<T extends SortableItem>({
  items,
  onMoveUp,
  onMoveDown,
  renderItem,
  className = '',
  showIndexes = true,
  isLoading = false
}: SortListProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No items to sort</p>
      </div>
    )
  }

  const sortedItems = [...items].sort((a, b) => a.sort_index - b.sort_index)

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedItems.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          {/* Drag Handle */}
          <div className="text-gray-400 cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Index Badge */}
          {showIndexes && (
            <Badge variant="outline" className="w-8 h-6 text-xs justify-center">
              {index + 1}
            </Badge>
          )}

          {/* Item Content */}
          <div className="flex-1 min-w-0">
            {renderItem ? (
              renderItem(item, index)
            ) : (
              <div>
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(item.id)}
              disabled={index === 0 || isLoading}
              className="p-1 h-8 w-8"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(item.id)}
              disabled={index === sortedItems.length - 1 || isLoading}
              className="p-1 h-8 w-8"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper component for simple text-based items
interface SimpleSortListProps {
  items: SortableItem[]
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  className?: string
  isLoading?: boolean
}

export function SimpleSortList({
  items,
  onMoveUp,
  onMoveDown,
  className,
  isLoading
}: SimpleSortListProps) {
  return (
    <SortList
      items={items}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      className={className}
      isLoading={isLoading}
      renderItem={(item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name}</p>
        </div>
      )}
    />
  )
}
