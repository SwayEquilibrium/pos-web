'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Plus, X, Settings, ExternalLink, Search, Tags } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  is_available: boolean
  modifiers_count?: number
  image_url?: string
}

interface Modifier {
  id: string
  name: string
  price_adjustment: number
  is_required: boolean
}

interface ModifierGroup {
  id: string
  name: string
  description?: string
  is_required: boolean
  max_selections: number
  modifiers: Modifier[]
}

import { getProductById } from '@/lib/menuData'

// Mock data - replace with real data fetching  
const getProductData = (productId: string) => {
  const product = getProductById(productId)
  return product || {
    id: productId,
    name: 'Nyt Produkt',
    description: 'Beskrivelse af produktet',
    price: 0,
    category_id: '1',
    is_available: true,
    modifiers_count: 0
  }
}

const mockModifierGroups: ModifierGroup[] = [
  {
    id: '1',
    name: 'Størrelse',
    description: 'Vælg størrelse på din bøf',
    is_required: true,
    max_selections: 1,
    modifiers: [
      { id: '1', name: 'Normal', price_adjustment: 0, is_required: false },
      { id: '2', name: 'Stor (+50g)', price_adjustment: 25, is_required: false },
      { id: '3', name: 'XL (+100g)', price_adjustment: 45, is_required: false }
    ]
  },
  {
    id: '2',
    name: 'Tilbehør',
    description: 'Vælg tilbehør til din bøf',
    is_required: false,
    max_selections: 3,
    modifiers: [
      { id: '4', name: 'Extra løg', price_adjustment: 10, is_required: false },
      { id: '5', name: 'Bearnaise sauce', price_adjustment: 15, is_required: false },
      { id: '6', name: 'Pommes frites', price_adjustment: 20, is_required: false },
      { id: '7', name: 'Salat', price_adjustment: 12, is_required: false }
    ]
  }
]

// Available modifier groups from the global addons-modifiers system
const mockAvailableGroups: ModifierGroup[] = [
  {
    id: 'global-1',
    name: 'Sovser',
    description: 'Vælg sovser til dit produkt',
    is_required: false,
    max_selections: 5,
    modifiers: [
      { id: 'g1', name: 'Ketchup', price_adjustment: 0, is_required: false },
      { id: 'g2', name: 'Mayo', price_adjustment: 0, is_required: false },
      { id: 'g3', name: 'BBQ Sauce', price_adjustment: 3, is_required: false },
      { id: 'g4', name: 'Hot Sauce', price_adjustment: 2, is_required: false },
      { id: 'g5', name: 'Hvidløg Aioli', price_adjustment: 5, is_required: false }
    ]
  },
  {
    id: 'global-2',
    name: 'Extra Tilbehør',
    description: 'Tilføj ekstra tilbehør',
    is_required: false,
    max_selections: 10,
    modifiers: [
      { id: 'g6', name: 'Extra Ost', price_adjustment: 8, is_required: false },
      { id: 'g7', name: 'Bacon', price_adjustment: 12, is_required: false },
      { id: 'g8', name: 'Svampe', price_adjustment: 6, is_required: false },
      { id: 'g9', name: 'Pepperoni', price_adjustment: 10, is_required: false }
    ]
  }
]

export default function ProductEditor() {
  const router = useRouter()
  const { menuId, productId } = useParams()
  const [product, setProduct] = useState<Product>(() => getProductData(productId as string))
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(mockModifierGroups)
  const [availableGroups] = useState<ModifierGroup[]>(mockAvailableGroups)
  const [showAddFromExisting, setShowAddFromExisting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual save logic
      console.log('Saving product:', product)
      console.log('Modifier groups:', modifierGroups)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push(`/menu/${menuId}`)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProduct = (field: keyof Product, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }))
  }

  const addModifierGroup = () => {
    const newGroup: ModifierGroup = {
      id: Date.now().toString(),
      name: 'Ny gruppe',
      description: '',
      is_required: false,
      max_selections: 1,
      modifiers: []
    }
    setModifierGroups(prev => [...prev, newGroup])
  }

  const updateModifierGroup = (groupId: string, field: keyof ModifierGroup, value: any) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, [field]: value } : group
    ))
  }

  const removeModifierGroup = (groupId: string) => {
    setModifierGroups(prev => prev.filter(group => group.id !== groupId))
  }

  const addModifier = (groupId: string) => {
    const newModifier: Modifier = {
      id: Date.now().toString(),
      name: 'Nyt tilvalg',
      price_adjustment: 0,
      is_required: false
    }
    
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, modifiers: [...group.modifiers, newModifier] }
        : group
    ))
  }

  const updateModifier = (groupId: string, modifierId: string, field: keyof Modifier, value: any) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            modifiers: group.modifiers.map(mod => 
              mod.id === modifierId ? { ...mod, [field]: value } : mod
            )
          }
        : group
    ))
  }

  const removeModifier = (groupId: string, modifierId: string) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, modifiers: group.modifiers.filter(mod => mod.id !== modifierId) }
        : group
    ))
  }

  const addExistingGroup = (groupToAdd: ModifierGroup) => {
    // Create a copy of the group with a new ID to avoid conflicts
    const newGroup: ModifierGroup = {
      ...groupToAdd,
      id: `product-${Date.now()}`,
      modifiers: groupToAdd.modifiers.map(mod => ({
        ...mod,
        id: `mod-${Date.now()}-${mod.id}`
      }))
    }
    
    setModifierGroups(prev => [...prev, newGroup])
    setShowAddFromExisting(false)
  }

  const filteredAvailableGroups = availableGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter out groups that are already added to this product
  const availableGroupsToAdd = filteredAvailableGroups.filter(group =>
    !modifierGroups.some(existing => 
      existing.name.toLowerCase() === group.name.toLowerCase()
    )
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/menu/${menuId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage til Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Rediger Produkt</h1>
              <p className="text-muted-foreground">Menu ID: {menuId}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Gemmer...' : 'Gem Ændringer'}
          </Button>
        </div>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Produkt Detaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Produktnavn</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => updateProduct('name', e.target.value)}
                  placeholder="Indtast produktnavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Pris (kr)</Label>
                <Input
                  id="price"
                  type="number"
                  value={product.price}
                  onChange={(e) => updateProduct('price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Input
                id="description"
                value={product.description || ''}
                onChange={(e) => updateProduct('description', e.target.value)}
                placeholder="Indtast produktbeskrivelse"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={product.is_available}
                onChange={(e) => updateProduct('is_available', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="available">Produkt er tilgængeligt</Label>
            </div>
          </CardContent>
        </Card>

        {/* Modifier Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tilvalg & Modifikationer</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowAddFromExisting(true)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Tilføj Eksisterende
                </Button>
                <Button onClick={addModifierGroup} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Opret Ny Gruppe
                </Button>
                <Button 
                  onClick={() => router.push('/menu/addons-modifiers')}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Administrer Alle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {modifierGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen tilvalgsgrupper endnu</p>
                <p className="text-sm">Klik "Tilføj Gruppe" for at oprette den første gruppe</p>
              </div>
            ) : (
              modifierGroups.map((group) => (
                <Card key={group.id} className="border-2">
                  <CardHeader className="pb-3">
                                              <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Input
                                value={group.name}
                                onChange={(e) => updateModifierGroup(group.id, 'name', e.target.value)}
                                className="font-semibold"
                                placeholder="Gruppenavn"
                              />
                              {group.is_required && (
                                <Badge variant="destructive">Påkrævet</Badge>
                              )}
                              {group.id.startsWith('global-') || group.id.startsWith('product-') && (
                                <Badge variant="outline" className="text-xs">
                                  Fra bibliotek
                                </Badge>
                              )}
                            </div>
                            <Button 
                              onClick={() => removeModifierGroup(group.id)}
                              variant="outline" 
                              size="sm"
                              className="text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Beskrivelse</Label>
                        <Input
                          value={group.description || ''}
                          onChange={(e) => updateModifierGroup(group.id, 'description', e.target.value)}
                          placeholder="Gruppebeskrivelse"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Max valg</Label>
                        <Input
                          type="number"
                          value={group.max_selections}
                          onChange={(e) => updateModifierGroup(group.id, 'max_selections', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id={`required-${group.id}`}
                          checked={group.is_required}
                          onChange={(e) => updateModifierGroup(group.id, 'is_required', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`required-${group.id}`}>Påkrævet</Label>
                      </div>
                    </div>
                    
                    {/* Modifiers in group */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Tilvalg i gruppen</Label>
                        <Button 
                          onClick={() => addModifier(group.id)}
                          variant="outline" 
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Tilføj
                        </Button>
                      </div>
                      
                      {group.modifiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Ingen tilvalg i denne gruppe
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {group.modifiers.map((modifier) => (
                            <div key={modifier.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                              <Input
                                value={modifier.name}
                                onChange={(e) => updateModifier(group.id, modifier.id, 'name', e.target.value)}
                                placeholder="Tilvalgnavn"
                                className="flex-1"
                              />
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={modifier.price_adjustment}
                                  onChange={(e) => updateModifier(group.id, modifier.id, 'price_adjustment', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">kr</span>
                              </div>
                              <Button 
                                onClick={() => removeModifier(group.id, modifier.id)}
                                variant="outline" 
                                size="sm"
                                className="text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Add Existing Groups Modal */}
        {showAddFromExisting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tilføj Eksisterende Modifier Grupper</CardTitle>
                  <Button 
                    onClick={() => setShowAddFromExisting(false)}
                    variant="outline" 
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg efter grupper..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh]">
                {availableGroupsToAdd.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tags className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {searchTerm 
                        ? 'Ingen grupper matcher din søgning' 
                        : 'Alle tilgængelige grupper er allerede tilføjet'
                      }
                    </p>
                    <Button 
                      onClick={() => router.push('/menu/addons-modifiers')}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Opret Nye Grupper
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableGroupsToAdd.map((group) => (
                      <Card key={group.id} className="border-2 hover:border-primary transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              {group.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {group.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {group.is_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Påkrævet
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {group.modifiers.length} items
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm">
                              <p className="font-medium mb-2">Items i denne gruppe:</p>
                              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                {group.modifiers.slice(0, 5).map((modifier) => (
                                  <div key={modifier.id} className="flex justify-between items-center p-2 bg-muted rounded text-xs">
                                    <span>{modifier.name}</span>
                                    <span className={`font-mono ${
                                      modifier.price_adjustment > 0 ? 'text-green-600' : 
                                      modifier.price_adjustment < 0 ? 'text-red-600' : 
                                      'text-muted-foreground'
                                    }`}>
                                      {modifier.price_adjustment > 0 ? '+' : ''}{modifier.price_adjustment} kr
                                    </span>
                                  </div>
                                ))}
                                {group.modifiers.length > 5 && (
                                  <div className="text-xs text-muted-foreground text-center py-1">
                                    +{group.modifiers.length - 5} flere...
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => addExistingGroup(group)}
                              className="w-full"
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Tilføj til Produkt
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
