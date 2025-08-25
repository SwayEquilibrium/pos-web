'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimpleBackButton } from '@/components/BackNavigation'

interface GridSettings {
  columns: number
  rows: number
  buttonSize: 'small' | 'medium' | 'large'
  showImages: boolean
  showPrices: boolean
  compactMode: boolean
}

interface ScreenPreset {
  name: string
  description: string
  screenSize: string
  recommended: GridSettings
}

const screenPresets: ScreenPreset[] = [
  {
    name: '10" Tablet',
    description: 'Lille tablet eller netbook',
    screenSize: '10 tommer',
    recommended: { columns: 3, rows: 4, buttonSize: 'medium', showImages: true, showPrices: true, compactMode: false }
  },
  {
    name: '12" Laptop/Tablet',
    description: 'Standard laptop eller stor tablet',
    screenSize: '12 tommer',
    recommended: { columns: 4, rows: 4, buttonSize: 'medium', showImages: true, showPrices: true, compactMode: false }
  },
  {
    name: '13" Laptop',
    description: 'Standard laptop skærm',
    screenSize: '13 tommer',
    recommended: { columns: 4, rows: 5, buttonSize: 'large', showImages: true, showPrices: true, compactMode: false }
  },
  {
    name: 'Kompakt View',
    description: 'Maksimal udnyttelse af plads',
    screenSize: 'Alle størrelser',
    recommended: { columns: 6, rows: 6, buttonSize: 'small', showImages: false, showPrices: true, compactMode: true }
  }
]

export default function DisplaySettings() {
  const router = useRouter()
  const [currentSettings, setCurrentSettings] = useState<GridSettings>({
    columns: 4,
    rows: 4,
    buttonSize: 'medium',
    showImages: true,
    showPrices: true,
    compactMode: false
  })

  const [previewMode, setPreviewMode] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('pos-grid-settings')
    if (saved) {
      try {
        setCurrentSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load grid settings:', error)
      }
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('pos-grid-settings', JSON.stringify(currentSettings))
    // In a real app, this would also sync to the database
    alert('Indstillinger gemt! ✅')
  }

  const applyPreset = (preset: ScreenPreset) => {
    setCurrentSettings(preset.recommended)
  }

  const getButtonSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'h-16 text-xs'
      case 'medium': return 'h-20 text-sm'
      case 'large': return 'h-24 text-base'
      default: return 'h-20 text-sm'
    }
  }

  const getGridClass = () => {
    return `grid-cols-${currentSettings.columns}`
  }

  // Mock products for preview
  const mockProducts = [
    { id: '1', name: 'Caesar Salat', price: 89, image: '🥗' },
    { id: '2', name: 'Bøf med pommes', price: 189, image: '🥩' },
    { id: '3', name: 'Pasta Carbonara', price: 129, image: '🍝' },
    { id: '4', name: 'Pizza Margherita', price: 149, image: '🍕' },
    { id: '5', name: 'Burger Classic', price: 169, image: '🍔' },
    { id: '6', name: 'Fish & Chips', price: 159, image: '🐟' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skærm Indstillinger</h1>
          <p className="text-muted-foreground">Tilpas grid layout til din skærmstørrelse</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '⚙️ Indstillinger' : '👁️ Forhåndsvisning'}
          </Button>
          <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
            💾 Gem Indstillinger
          </Button>
        </div>
      </div>

      {!previewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Screen Presets */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Skærm Presets</CardTitle>
              <p className="text-sm text-muted-foreground">
                Vælg en forudkonfigureret opsætning baseret på din skærmstørrelse
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {screenPresets.map((preset, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{preset.name}</h4>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </div>
                    <Badge variant="outline">{preset.screenSize}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {preset.recommended.columns}x{preset.recommended.rows} grid, 
                    {preset.recommended.buttonSize} knapper
                    {preset.recommended.compactMode && ', kompakt mode'}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => applyPreset(preset)}
                    className="w-full"
                  >
                    Anvend Preset
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Manual Settings */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Manuel Konfiguration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid Size */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Grid Størrelse</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="columns">Kolonner</Label>
                    <select
                      id="columns"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentSettings.columns}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, columns: parseInt(e.target.value) }))}
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} kolonner</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rows">Rækker</Label>
                    <select
                      id="rows"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentSettings.rows}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} rækker</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {currentSettings.columns * currentSettings.rows} knapper synlige ad gangen
                </div>
              </div>

              {/* Button Size */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Knap Størrelse</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['small', 'medium', 'large'].map(size => (
                    <Button
                      key={size}
                      variant={currentSettings.buttonSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentSettings(prev => ({ ...prev, buttonSize: size as any }))}
                    >
                      {size === 'small' && '🔸 Lille'}
                      {size === 'medium' && '🔶 Mellem'}
                      {size === 'large' && '🔷 Stor'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Visnings Indstillinger</Label>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentSettings.showImages}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, showImages: e.target.checked }))}
                    />
                    Vis produkt billeder
                  </Label>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentSettings.showPrices}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, showPrices: e.target.checked }))}
                    />
                    Vis priser på knapper
                  </Label>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentSettings.compactMode}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                    />
                    Kompakt mode (mindre mellemrum)
                  </Label>
                </div>
              </div>

              {/* Current Settings Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Nuværende Opsætning:</h4>
                <div className="text-sm space-y-1">
                  <p>• {currentSettings.columns}x{currentSettings.rows} grid ({currentSettings.columns * currentSettings.rows} knapper)</p>
                  <p>• {currentSettings.buttonSize === 'small' ? 'Lille' : currentSettings.buttonSize === 'medium' ? 'Mellem' : 'Stor'} knap størrelse</p>
                  <p>• Billeder: {currentSettings.showImages ? 'Til' : 'Fra'}</p>
                  <p>• Priser: {currentSettings.showPrices ? 'Til' : 'Fra'}</p>
                  <p>• Kompakt: {currentSettings.compactMode ? 'Til' : 'Fra'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Preview Mode */
        <Card>
          <CardHeader>
            <CardTitle>👁️ Forhåndsvisning af Grid Layout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sådan vil dine produkt-knapper se ud med de valgte indstillinger
            </p>
          </CardHeader>
          <CardContent>
            <div 
              className={`grid gap-${currentSettings.compactMode ? '2' : '4'} ${getGridClass()}`}
              style={{ 
                gridTemplateColumns: `repeat(${currentSettings.columns}, minmax(0, 1fr))` 
              }}
            >
              {mockProducts.slice(0, currentSettings.columns * currentSettings.rows).map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className={`${getButtonSizeClass(currentSettings.buttonSize)} flex-col gap-1 p-2`}
                >
                  {currentSettings.showImages && (
                    <span className="text-2xl">{product.image}</span>
                  )}
                  <span className="font-medium truncate w-full">
                    {product.name}
                  </span>
                  {currentSettings.showPrices && (
                    <span className="text-primary font-semibold">
                      {product.price} kr
                    </span>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Forhåndsvisning Info:</h4>
              <div className="text-sm text-muted-foreground">
                <p>• Viser {currentSettings.columns * currentSettings.rows} produkter ad gangen</p>
                <p>• Scroll eller sidenavigation for flere produkter</p>
                <p>• Knap højde: {currentSettings.buttonSize === 'small' ? '64px' : currentSettings.buttonSize === 'medium' ? '80px' : '96px'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
