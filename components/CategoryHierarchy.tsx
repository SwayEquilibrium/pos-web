'use client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  parent_id?: string | null
  level?: number
  full_path?: string
  color?: string
  emoji?: string
  display_style?: 'emoji' | 'color' | 'image'
  image_thumbnail_url?: string
  has_children?: boolean
  product_count?: number
  child_categories?: number
}

interface CategoryHierarchyProps {
  category: Category
  showPath?: boolean
  showCounts?: boolean
  onClick?: (category: Category) => void
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export default function CategoryHierarchy({ 
  category, 
  showPath = false, 
  showCounts = true,
  onClick,
  className = "",
  size = 'medium'
}: CategoryHierarchyProps) {
  
  const getVisualElement = () => {
    const baseClasses = size === 'small' ? 'w-8 h-8 text-lg' : 
                       size === 'large' ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-xl'
    
    switch (category.display_style) {
      case 'emoji':
        return (
          <div className={`${baseClasses} rounded-lg flex items-center justify-center bg-gray-50`}>
            {category.emoji || '📁'}
          </div>
        )
      case 'color':
        return (
          <div 
            className={`${baseClasses} rounded-lg flex items-center justify-center text-white font-bold`}
            style={{ backgroundColor: category.color || '#3B82F6' }}
          >
            {category.emoji || (category.has_children ? '📁' : '🏷️')}
          </div>
        )
      case 'image':
        return category.image_thumbnail_url ? (
          <img 
            src={category.image_thumbnail_url} 
            alt={category.name}
            className={`${baseClasses} rounded-lg object-cover border`}
          />
        ) : (
          <div className={`${baseClasses} rounded-lg flex items-center justify-center bg-gray-100 text-gray-400`}>
            📷
          </div>
        )
      default:
        return (
          <div className={`${baseClasses} rounded-lg flex items-center justify-center bg-gray-50`}>
            {category.emoji || '📁'}
          </div>
        )
    }
  }

  const getIndentationLevel = () => {
    return (category.level || 0) * 16 // 16px per level
  }

  const renderHierarchyPath = () => {
    if (!showPath || !category.full_path) return null
    
    const pathParts = category.full_path.split(' → ')
    if (pathParts.length <= 1) return null
    
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {pathParts.slice(0, -1).map((part, index) => (
          <span key={index} className="flex items-center gap-1">
            {part}
            {index < pathParts.length - 2 && <span>→</span>}
          </span>
        ))}
      </div>
    )
  }

  const renderCounts = () => {
    if (!showCounts) return null
    
    const counts = []
    
    if (category.product_count && category.product_count > 0) {
      counts.push(
        <Badge key="products" variant="outline" className="text-xs">
          {category.product_count} produkter
        </Badge>
      )
    }
    
    if (category.child_categories && category.child_categories > 0) {
      counts.push(
        <Badge key="children" variant="secondary" className="text-xs">
          {category.child_categories} kategorier
        </Badge>
      )
    }
    
    if (category.has_children && !category.child_categories) {
      counts.push(
        <Badge key="has-children" variant="secondary" className="text-xs">
          Har underkategorier
        </Badge>
      )
    }
    
    return counts.length > 0 ? (
      <div className="flex gap-1 flex-wrap mt-2">
        {counts}
      </div>
    ) : null
  }

  const isRootCategory = !category.parent_id || category.level === 0
  const isSubcategory = category.parent_id && category.level && category.level > 0

  const cardContent = (
    <CardContent className={`${isRootCategory ? 'p-4' : 'p-3'} ${isSubcategory ? 'bg-gray-50/50' : ''}`}>
      {/* Master Category (Root) - Bold and prominent */}
      {isRootCategory && (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getVisualElement()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-gray-900 truncate ${
              size === 'small' ? 'text-base' : 
              size === 'large' ? 'text-xl' : 'text-lg'
            }`}>
              {category.name}
            </h2>
            
            <div className="text-sm text-gray-600 mt-1">
              Master Kategori
            </div>
          </div>
          
          {category.has_children && (
            <div className="flex items-center text-gray-400">
              <div className="text-sm mr-2">
                {category.child_categories || 0} underkategorier
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Subcategory - Indented and smaller */}
      {isSubcategory && (
        <div className="flex items-center gap-3 ml-4">
          {/* Connection line */}
          <div className="flex-shrink-0 w-6 flex justify-center">
            <div className="w-0.5 h-4 bg-gray-300 relative">
              <div className="absolute top-2 -right-1.5 w-3 h-0.5 bg-gray-300"></div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {getVisualElement()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-700 truncate ${
              size === 'small' ? 'text-sm' : 
              size === 'large' ? 'text-base' : 'text-sm'
            }`}>
              {category.name}
            </h3>
            
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
              <span>Underkategori</span>
              {category.product_count && category.product_count > 0 && (
                <Badge variant="outline" className="text-xs h-4">
                  {category.product_count} produkter
                </Badge>
              )}
            </div>
          </div>
          
          {category.has_children && (
            <div className="text-gray-400 text-sm">
              →
            </div>
          )}
        </div>
      )}
      
      {/* Show counts for root categories */}
      {isRootCategory && renderCounts()}
    </CardContent>
  )

  const cardClasses = `
    ${isRootCategory ? 'border-2 border-blue-200 bg-white shadow-sm' : 'border border-gray-200 bg-gray-50/30'}
    ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''}
    ${onClick && isRootCategory ? 'hover:border-blue-300 hover:shadow-lg' : ''}
    ${onClick && isSubcategory ? 'hover:border-gray-300 hover:bg-gray-50' : ''}
    ${className}
  `.trim()

  if (onClick) {
    return (
      <Card 
        className={cardClasses}
        onClick={() => onClick(category)}
        style={{ marginLeft: isSubcategory ? 20 : 0 }}
      >
        {cardContent}
      </Card>
    )
  }

  return (
    <Card 
      className={cardClasses}
      style={{ marginLeft: isSubcategory ? 20 : 0 }}
    >
      {cardContent}
    </Card>
  )
}

// Component for displaying category breadcrumbs
interface CategoryBreadcrumbsProps {
  breadcrumbs: Category[]
  onNavigate?: (category: Category) => void
}

export function CategoryBreadcrumbs({ breadcrumbs, onNavigate }: CategoryBreadcrumbsProps) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm">
      <span className="text-muted-foreground">📍</span>
      {breadcrumbs.map((category, index) => (
        <div key={category.id} className="flex items-center gap-2">
          {onNavigate ? (
            <button
              onClick={() => onNavigate(category)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <span className="text-sm">{category.emoji}</span>
              <span>{category.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm">{category.emoji}</span>
              <span>{category.name}</span>
            </div>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <span className="text-muted-foreground">→</span>
          )}
        </div>
      ))}
    </div>
  )
}
