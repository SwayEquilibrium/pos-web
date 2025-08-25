'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export interface VisualSettings {
  color: string
  emoji: string
  display_style: 'emoji' | 'color' | 'image'
  image_url?: string
  image_thumbnail_url?: string
}

interface VisualCustomizerProps {
  currentSettings: VisualSettings
  onChange: (settings: VisualSettings) => void
  type: 'category' | 'product'
  onImageUpload?: (file: File) => Promise<{ image_url: string; image_thumbnail_url: string }>
}

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#000000', '#FFFFFF', '#FEE2E2', '#FEF3C7', '#D1FAE5'
]

const CATEGORY_EMOJIS = [
  // General & Organization
  '📁', '🍽️', '📂', '🏷️', '📋', '🎯', '⭐', '🔥', '👑', '💎',
  
  // Beverages & Drinks
  '🍷', '🍾', '🥂', '🍻', '🍺', '🧃', '🥤', '☕', '🍵', '🧋',
  '🥛', '🍹', '🍸', '🧉', '🍶', '🥃', '🍯', '🫖', '🧊', '💧',
  
  // Main Dishes & Hot Food
  '🍕', '🍔', '🍖', '🥩', '🍗', '🥘', '🍲', '🍜', '🍝', '🥗',
  '🍳', '🥞', '🧆', '🌭', '🌮', '🌯', '🥙', '🥪', '🍱', '🍛',
  '🍙', '🍘', '🥟', '🦪', '🍣', '🍤', '🦐', '🦀', '🐟', '🐠',
  
  // Desserts & Sweets
  '🍰', '🎂', '🧁', '🍪', '🍫', '🍬', '🍭', '🍩', '🍮', '🍯',
  '🧇', '🥧', '🍨', '🍧', '🍦', '🧊', '🍓', '🫐', '🍒', '🍑',
  
  // Bread & Bakery
  '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🧈', '🥜', '🌰', '🥔',
  
  // International Cuisine
  '🍜', '🍲', '🥘', '🍛', '🍱', '🍙', '🍘', '🥟', '🥠', '🦪',
  '🫔', '🧆', '🥙', '🌯', '🌮', '🍝', '🍕', '🥗', '🍖', '🍗',
  
  // Fruits & Healthy
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
  '🥝', '🍑', '🥭', '🍍', '🥥', '🥑', '🍅', '🫒', '🌶️', '🥒'
]

const PRODUCT_EMOJIS = [
  // Hot Dishes & Mains
  '🍽️', '🍕', '🍔', '🍖', '🥩', '🍗', '🥘', '🍲', '🍜', '🍝',
  '🍳', '🥞', '🧆', '🌭', '🌮', '🌯', '🥙', '🥪', '🍱', '🍛',
  '🍙', '🍘', '🥟', '🦪', '🍣', '🍤', '🦐', '🦀', '🐟', '🐠',
  
  // Beverages
  '🍷', '🍾', '🥂', '🍻', '🍺', '🧃', '🥤', '☕', '🍵', '🧋',
  '🥛', '🍹', '🍸', '🧉', '🍶', '🥃', '🫖', '💧', '🧊', '🥥',
  
  // Desserts & Sweets
  '🍰', '🎂', '🧁', '🍪', '🍫', '🍬', '🍭', '🍩', '🍮', '🍯',
  '🧇', '🥧', '🍨', '🍧', '🍦', '🍓', '🫐', '🍒', '🍑', '🥝',
  
  // Bread & Bakery
  '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🧈', '🥜', '🌰', '🥔',
  
  // Salads & Healthy
  '🥗', '🥑', '🍅', '🫒', '🌶️', '🥒', '🥕', '🌽', '🥬', '🥦',
  '🍆', '🫑', '🧄', '🧅', '🍄', '🥓', '🧀', '🥚', '🫘', '🌿',
  
  // Fruits
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍈', '🍍', '🥭', '🍑',
  
  // Snacks & Sides
  '🍟', '🥨', '🍿', '🥜', '🌰', '🥔', '🧅', '🫘', '🥖', '🥯',
  
  // International Specialties
  '🫔', '🥠', '🍢', '🍡', '🧊', '🦴', '🥄', '🍴', '🔪', '🥢'
]

// Visual Editor Modal Component
function VisualEditor({ 
  currentSettings, 
  onChange, 
  type,
  onImageUpload 
}: VisualCustomizerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiDropdownRef = useRef<HTMLDivElement>(null)

  const emojis = type === 'category' ? CATEGORY_EMOJIS : PRODUCT_EMOJIS

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiDropdownRef.current && !emojiDropdownRef.current.contains(event.target as Node)) {
        setShowEmojiDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStyleChange = (style: 'emoji' | 'color' | 'image') => {
    onChange({
      ...currentSettings,
      display_style: style
    })
  }

  const handleColorChange = (color: string) => {
    onChange({
      ...currentSettings,
      color,
      display_style: 'color'
    })
  }

  const handleEmojiChange = (emoji: string) => {
    onChange({
      ...currentSettings,
      emoji,
      display_style: 'emoji'
    })
    setShowEmojiDropdown(false) // Close dropdown after selection
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onImageUpload) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vælg venligst en billedfil')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Billedet er for stort. Maksimum 5MB.')
      return
    }

    setIsUploading(true)
    try {
      const result = await onImageUpload(file)
      onChange({
        ...currentSettings,
        image_url: result.image_url,
        image_thumbnail_url: result.image_thumbnail_url,
        display_style: 'image'
      })
    } catch (error) {
      console.error('Upload fejl:', error)
      alert('Fejl ved upload af billede')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Display Style Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visningstype</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={currentSettings.display_style === 'emoji' ? 'default' : 'outline'}
            onClick={() => handleStyleChange('emoji')}
            className="flex-1 sm:flex-none"
          >
            😀 Emoji
          </Button>
          <Button
            size="sm"
            variant={currentSettings.display_style === 'color' ? 'default' : 'outline'}
            onClick={() => handleStyleChange('color')}
            className="flex-1 sm:flex-none"
          >
            🎨 Farve
          </Button>
          <Button
            size="sm"
            variant={currentSettings.display_style === 'image' ? 'default' : 'outline'}
            onClick={() => handleStyleChange('image')}
            className="flex-1 sm:flex-none"
          >
            📷 Billede
          </Button>
        </div>
      </div>

      {/* Emoji Selector - Dropdown */}
      {currentSettings.display_style === 'emoji' && (
        <div className="space-y-3" ref={emojiDropdownRef}>
          <Label className="text-sm font-medium">Vælg Emoji</Label>
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowEmojiDropdown(!showEmojiDropdown)}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{currentSettings.emoji}</span>
                <span>Vælg emoji</span>
              </span>
              <span className={`transition-transform ${showEmojiDropdown ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </Button>
            
            {showEmojiDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      className={`w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors ${
                        currentSettings.emoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleEmojiChange(emoji)}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Picker */}
      {currentSettings.display_style === 'color' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Vælg Farve</Label>
          <div className="space-y-3">
            {/* Preset Colors */}
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    currentSettings.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom Color Input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentSettings.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={currentSettings.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border rounded text-sm"
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Upload */}
      {currentSettings.display_style === 'image' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Upload Billede</Label>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {currentSettings.image_thumbnail_url ? (
                <div className="space-y-2">
                  <img 
                    src={currentSettings.image_thumbnail_url} 
                    alt="Current"
                    className="w-20 h-20 object-cover mx-auto rounded"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploader...' : 'Skift Billede'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400 text-4xl">📷</div>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploader...' : 'Vælg Billede'}
                  </Button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP. Maks 5MB.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VisualCustomizer({ 
  currentSettings, 
  onChange, 
  type,
  onImageUpload 
}: VisualCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const renderPreview = (size: 'small' | 'large' = 'small') => {
    const baseClasses = size === 'small' 
      ? "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
      : "w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold"
    
    switch (currentSettings.display_style) {
      case 'emoji':
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            {currentSettings.emoji}
          </div>
        )
      case 'color':
        return (
          <div 
            className={`${baseClasses} text-white`}
            style={{ backgroundColor: currentSettings.color }}
          >
            {type === 'category' ? '📁' : '🍽️'}
          </div>
        )
      case 'image':
        return currentSettings.image_thumbnail_url ? (
          <img 
            src={currentSettings.image_thumbnail_url} 
            alt="Preview"
            className={`${baseClasses} object-cover border`}
          />
        ) : (
          <div className={`${baseClasses} bg-gray-100 text-gray-400`}>
            📷
          </div>
        )
      default:
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            ?
          </div>
        )
    }
  }

  const getDisplayText = () => {
    switch (currentSettings.display_style) {
      case 'emoji':
        return `${currentSettings.emoji} Emoji`
      case 'color':
        return `🎨 ${currentSettings.color}`
      case 'image':
        return currentSettings.image_thumbnail_url ? '📷 Billede' : '📷 Intet billede'
      default:
        return 'Ikke valgt'
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Visuel Tilpasning</Label>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto p-3"
          >
            <div className="flex items-center gap-3">
              {renderPreview('small')}
              <div className="text-left">
                <div className="text-sm font-medium">{getDisplayText()}</div>
                <div className="text-xs text-muted-foreground">
                  Klik for at redigere
                </div>
              </div>
            </div>
            <div className="text-muted-foreground">
              ✏️
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {renderPreview('small')}
              Rediger Visuel Tilpasning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Forhåndsvisning</Label>
              {renderPreview('large')}
            </div>
            
            <VisualEditor
              currentSettings={currentSettings}
              onChange={onChange}
              type={type}
              onImageUpload={onImageUpload}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
