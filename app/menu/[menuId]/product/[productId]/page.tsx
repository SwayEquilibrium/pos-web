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

import { useProduct, useProductModifierGroups, useAvailableModifierGroups, useAttachGroupToProduct, useDetachGroupFromProduct } from '@/hooks/menu/useProducts'
import { useModifierGroups } from '@/hooks/menu/useModifierGroups'

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
  const { data: product, isLoading: productLoading } = useProduct(productId)
  const { data: modifierGroups = [] } = useProductModifierGroups(productId)
  const { data: availableGroups = [] } = useAvailableModifierGroups(productId)
  const attachGroup = useAttachGroupToProduct()
  const detachGroup = useDetachGroupFromProduct()
  const { data: allModifierGroups = [] } = useModifierGroups()

  const isLoading = productLoading
  const [showAddFromExisting, setShowAddFromExisting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')


  const handleSave = async () => {
    try {
      // TODO: Implement actual save logic with real database mutation
      console.log('Saving product:', product)
      console.log('Modifier groups:', modifierGroups)

      // For now, just navigate back
      router.push(`/menu/${menuId}`)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const updateProduct = (field: keyof Product, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }))
  }

  const addModifierGroup = async (groupId: string, isRequired = false) => {
    try {
      await attachGroup.mutateAsync({
        productId: productId as string,
        groupId,
        isRequired
      })
    } catch (error) {
      console.error('Failed to attach modifier group:', error)
    }
  }

  // Note: Modifier group editing should be done in the Modifiers tab
  // This component only handles attaching/detaching existing modifier groups to products

  const removeModifierGroup = async (groupId: string) => {
    try {
      await detachGroup.mutateAsync({
        productId: productId as string,
        groupId
      })
    } catch (error) {
      console.error('Failed to detach modifier group:', error)
    }
  }



  const addExistingGroup = async (groupToAdd: ModifierGroup, isRequired = false) => {
    try {
      await attachGroup.mutateAsync({
        productId: productId as string,
        groupId: groupToAdd.id,
        isRequired
      })
      setShowAddFromExisting(false)
    } catch (error) {
      console.error('Failed to attach modifier group:', error)
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/menu/${menuId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Loading Product...</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading product data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/menu/${menuId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-red-600">Product Not Found</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">The requested product could not be found.</p>
                <Button onClick={() => router.push(`/menu/${menuId}`)}>
                  Return to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
            disabled={productLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {productLoading ? 'Gemmer...' : 'Gem Ændringer'}
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
                  onClick={() => router.push(`/menu/${menuId}?tab=modifiers`)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Administrer Modifiers
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {modifierGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No modifier groups attached to this product</p>
                <p className="text-sm">Click "Add Existing" to attach modifier groups from the library</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modifierGroups.map((group) => (
                  <Card key={group.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{group.name}</h3>
                          {group.is_required && (
                            <Badge variant="destructive">Required</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Max: {group.max_selections}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => removeModifierGroup(group.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          disabled={detachGroup.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Modifiers in this group:</Label>
                        {group.modifiers && group.modifiers.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.modifiers.map((modifier) => (
                              <div key={modifier.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                <span>{modifier.name}</span>
                                <span className={modifier.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {modifier.price_adjustment >= 0 ? '+' : ''}{modifier.price_adjustment}€
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No modifiers in this group</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                      onClick={() => router.push(`/menu/${menuId}?tab=modifiers`)}
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
                              onClick={() => addExistingGroup(group, false)}
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
