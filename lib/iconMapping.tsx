import React from 'react'
import * as LucideIcons from 'lucide-react'

// Type for icon names - using a subset of common Lucide icons
export type IconName = 
  | 'utensils'
  | 'coffee'
  | 'pizza'
  | 'sandwich'
  | 'salad'
  | 'soup'
  | 'ice-cream'
  | 'wine'
  | 'beer'
  | 'cocktail'
  | 'apple'
  | 'carrot'
  | 'fish'
  | 'beef'
  | 'cookie'
  | 'cake'
  | 'donut'
  | 'croissant'
  | 'bagel'
  | 'pretzel'
  | 'hotdog'
  | 'hamburger'
  | 'taco'
  | 'burrito'
  | 'ramen'
  | 'sushi'
  | 'pasta'
  | 'rice'
  | 'bread'
  | 'cheese'
  | 'egg'
  | 'milk'
  | 'honey'
  | 'pepper'
  | 'salt'
  | 'leaf'
  | 'wheat'
  | 'grape'
  | 'cherry'
  | 'strawberry'
  | 'banana'
  | 'orange'
  | 'lemon'
  | 'avocado'
  | 'corn'
  | 'potato'
  | 'tomato'
  | 'onion'
  | 'garlic'
  | 'mushroom'
  | 'broccoli'
  | 'cabbage'
  | 'lettuce'
  | 'peas'
  | 'beans'
  | 'nuts'
  | 'seeds'
  | 'flour'
  | 'sugar'
  | 'oil'
  | 'butter'
  | 'cream'
  | 'yogurt'
  | 'ice'
  | 'fire'
  | 'steam'
  | 'clock'
  | 'timer'
  | 'thermometer'
  | 'scale'
  | 'measuring-cup'
  | 'spoon'
  | 'fork'
  | 'knife'
  | 'plate'
  | 'bowl'
  | 'cup'
  | 'glass'
  | 'bottle'
  | 'can'
  | 'box'
  | 'package'
  | 'shopping-bag'
  | 'shopping-cart'
  | 'receipt'
  | 'credit-card'
  | 'wallet'
  | 'dollar-sign'
  | 'euro'
  | 'pound'
  | 'yen'
  | 'percent'
  | 'plus'
  | 'minus'
  | 'x'
  | 'check'
  | 'star'
  | 'heart'
  | 'thumbs-up'
  | 'thumbs-down'
  | 'smile'
  | 'frown'
  | 'meh'
  | 'flag'
  | 'tag'
  | 'bookmark'
  | 'folder'
  | 'file'
  | 'image'
  | 'camera'
  | 'video'
  | 'music'
  | 'headphones'
  | 'speaker'
  | 'microphone'
  | 'phone'
  | 'mail'
  | 'message'
  | 'chat'
  | 'comment'
  | 'bell'
  | 'alert-circle'
  | 'info'
  | 'help-circle'
  | 'settings'
  | 'tool'
  | 'wrench'
  | 'hammer'
  | 'screwdriver'
  | 'paintbrush'
  | 'palette'
  | 'color-wheel'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'zap'
  | 'flame'
  | 'droplet'
  | 'snowflake'
  | 'tree'
  | 'flower'
  | 'plant'
  | 'seedling'
  | 'cactus'
  | 'palm-tree'
  | 'evergreen-tree'
  | 'deciduous-tree'
  | 'herb'
  | 'clover'
  | 'four-leaf-clover'
  | 'bamboo'
  | 'ear-of-corn'
  | 'sheaf-of-rice'
  | 'tulip'
  | 'rose'
  | 'hibiscus'
  | 'sunflower'
  | 'blossom'
  | 'cherry-blossom'
  | 'bouquet'
  | 'wreath'
  | 'evergreen'
  | 'maple-leaf'
  | 'fallen-leaf'
  | 'leaves'

// Icon mapping - maps string names to Lucide React components
const iconMap: Record<string, React.ComponentType<any>> = {
  // Food & Drink
  utensils: LucideIcons.Utensils,
  coffee: LucideIcons.Coffee,
  wine: LucideIcons.Wine,
  beer: LucideIcons.Beer,
  
  // Common UI
  plus: LucideIcons.Plus,
  minus: LucideIcons.Minus,
  x: LucideIcons.X,
  check: LucideIcons.Check,
  star: LucideIcons.Star,
  heart: LucideIcons.Heart,
  
  // Navigation
  'chevron-right': LucideIcons.ChevronRight,
  'chevron-left': LucideIcons.ChevronLeft,
  'chevron-up': LucideIcons.ChevronUp,
  'chevron-down': LucideIcons.ChevronDown,
  
  // Business
  'shopping-cart': LucideIcons.ShoppingCart,
  'credit-card': LucideIcons.CreditCard,
  'dollar-sign': LucideIcons.DollarSign,
  receipt: LucideIcons.Receipt,
  
  // System
  settings: LucideIcons.Settings,
  tool: LucideIcons.Wrench, // Tool doesn't exist in lucide-react, using Wrench instead
  wrench: LucideIcons.Wrench,
  
  // Content
  folder: LucideIcons.Folder,
  file: LucideIcons.File,
  image: LucideIcons.Image,
  tag: LucideIcons.Tag,
  bookmark: LucideIcons.Bookmark,
  
  // Communication
  bell: LucideIcons.Bell,
  mail: LucideIcons.Mail,
  phone: LucideIcons.Phone,
  'message-circle': LucideIcons.MessageCircle,
  
  // Status
  'alert-circle': LucideIcons.AlertCircle,
  'info': LucideIcons.Info,
  'help-circle': LucideIcons.HelpCircle,
  'check-circle': LucideIcons.CheckCircle,
  'x-circle': LucideIcons.XCircle,
  
  // Time & Weather
  clock: LucideIcons.Clock,
  timer: LucideIcons.Timer,
  sun: LucideIcons.Sun,
  moon: LucideIcons.Moon,
  cloud: LucideIcons.Cloud,
  
  // Nature
  tree: LucideIcons.TreePine, // Tree doesn't exist in lucide-react, using TreePine instead
  flower: LucideIcons.Flower2, // Using Flower2 for better compatibility
  leaf: LucideIcons.Leaf,
  
  // Default fallback
  circle: LucideIcons.Circle,
}

// Component to render dynamic icons
export interface DynamicIconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  name, 
  size = 24, 
  className = '', 
  color 
}) => {
  // Handle undefined or null name by providing a fallback
  if (!name || typeof name !== 'string') {
    const IconComponent = iconMap.circle
    return (
      <IconComponent 
        size={size} 
        className={className}
        color={color}
      />
    )
  }

  // Convert name to lowercase and replace spaces/underscores with hyphens
  const normalizedName = name.toLowerCase().replace(/[_\s]/g, '-')
  
  // Get the icon component or fallback to Circle
  const IconComponent = iconMap[normalizedName] || iconMap.circle
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      color={color}
    />
  )
}

// Helper function to get available icon names
export const getAvailableIcons = (): string[] => {
  return Object.keys(iconMap)
}

// Helper function to check if an icon exists
export const iconExists = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false
  }
  const normalizedName = name.toLowerCase().replace(/[_\s]/g, '-')
  return normalizedName in iconMap
}

export default DynamicIcon
