'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  FolderOpen,
  Package,
  Layers,
  Grid3X3,
  Settings
} from 'lucide-react'
import type { MenuToggleTab } from '@/lib/types/menu'

interface MenuTopToggleProps {
  activeTab: MenuToggleTab
  onTabChange: (tab: MenuToggleTab) => void
  counts?: {
    menucards?: number
    categories?: number
    products?: number
    modifiers?: number
    productGroups?: number
  }
  className?: string
}

const tabConfig = {
  menucards: {
    label: 'Menucards',
    icon: <Grid3X3 className="w-4 h-4" />,
    description: 'Organize menu displays'
  },
  categories: {
    label: 'Categories',
    icon: <FolderOpen className="w-4 h-4" />,
    description: 'Menu organization'
  },
  products: {
    label: 'Products',
    icon: <ChefHat className="w-4 h-4" />,
    description: 'Menu items'
  },
  modifiers: {
    label: 'Modifiers',
    icon: <Settings className="w-4 h-4" />,
    description: 'Product options & add-ons'
  },
  'product-groups': {
    label: 'Product Groups',
    icon: <Layers className="w-4 h-4" />,
    description: 'Group related products'
  }
} as const

export default function MenuTopToggle({
  activeTab,
  onTabChange,
  counts = {},
  className = ''
}: MenuTopToggleProps) {
  const tabs = Object.keys(tabConfig) as MenuToggleTab[]

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your restaurant menu structure and content
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => {
            const config = tabConfig[tab]
            const count = counts[tab]
            const isActive = activeTab === tab

            return (
              <Button
                key={tab}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 ${
                  isActive 
                    ? 'bg-white shadow-sm border border-gray-200 transform scale-105' 
                    : 'hover:bg-white/50 hover:shadow-sm hover:transform hover:scale-[1.02]'
                }`}
              >
                {config.icon}
                <span className="font-medium">{config.label}</span>
                {count !== undefined && (
                  <Badge 
                    variant={isActive ? 'default' : 'secondary'}
                    className="ml-1 text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>

        {/* Tab Description */}
        <div className="mt-3 pb-4">
          <p className="text-sm text-gray-600">
            {tabConfig[activeTab].description}
          </p>
        </div>
      </div>
    </div>
  )
}
