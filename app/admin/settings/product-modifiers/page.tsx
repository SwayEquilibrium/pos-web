'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useModifierGroups, useAddProductModifierGroup } from '@/hooks/useModifiers'
import { SimpleBackButton } from '@/components/BackNavigation'

export default function ProductModifiersPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  
  const { data: categories } = useCategories()
  const { data: products } = useProductsByCategory(selectedCategory || undefined)
  const { data: modifierGroups } = useModifierGroups()
  
  const addProductModifierGroup = useAddProductModifierGroup()

  const handleLinkModifierGroup = async (modifierGroupId: string, isRequired: boolean = false) => {
    if (!selectedProduct) {
      alert('Vælg først et produkt')
      return
    }

    try {
      await addProductModifierGroup.mutateAsync({
        product_id: selectedProduct,
        modifier_group_id: modifierGroupId,
        is_required: isRequired
      })
      
      alert('Modifier gruppe linket til produkt! ✅')
    } catch (error) {
      console.error('Error linking modifier group:', error)
      alert('Fejl ved linking: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const selectedProductData = products?.find(p => p.id === selectedProduct)

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Produkt Modifiers</h1>
        <p className="text-muted-foreground">Link modifier grupper til specifikke produkter</p>
      </div>

      {/* Product Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Vælg Produkt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <select
                id="category"
                className="w-full px-3 py-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedProduct('') // Reset product when category changes
                }}
              >
                <option value="">Vælg kategori</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label htmlFor="product">Produkt</Label>
                <select
                  id="product"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Vælg produkt</option>
                  {products?.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price} kr.
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProductData && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold">{selectedProductData.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Pris: {selectedProductData.price} kr.
                  {selectedProductData.is_open_price && ' (Åben pris)'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Tilknyt Modifier Grupper</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedProduct ? (
              <p className="text-muted-foreground text-center py-8">
                Vælg først et produkt for at se tilgængelige modifier grupper
              </p>
            ) : (
              <div className="space-y-3">
                {modifierGroups?.map(group => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={group.type === 'variant' ? 'default' : 'secondary'}>
                          {group.type === 'variant' ? 'Variant' : 'Addon'}
                        </Badge>
                        {group.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Standard Påkrævet
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkModifierGroup(group.id, false)}
                        disabled={addProductModifierGroup.isPending}
                      >
                        Tilknyt som Valgfri
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLinkModifierGroup(group.id, true)}
                        disabled={addProductModifierGroup.isPending}
                      >
                        Tilknyt som Påkrævet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup Examples */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Hurtig Opsætning - Eksempler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🍕 Pizza</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Størrelse (Variant, Påkrævet)</li>
                <li>• Ekstra (Addon, Valgfri)</li>
                <li>• Sauce (Variant, Valgfri)</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🍔 Burger</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Størrelse (Variant, Påkrævet)</li>
                <li>• Ekstra (Addon, Valgfri)</li>
                <li>• Menu Tilvalg (+10kr)</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">☕ Kaffe</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Størrelse (Variant, Påkrævet)</li>
                <li>• Mælk Type (Variant, Valgfri)</li>
                <li>• Ekstra Shot (+15kr)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Sådan bruges Modifier Systemet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🏷️ Variants (Vælg én)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Kunden skal vælge præcis én option</li>
                <li>• Perfekt til størrelser (S/M/L)</li>
                <li>• Kan have forskellig pris (+/- fra grundpris)</li>
                <li>• Kan gøres påkrævet</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">➕ Add-ons (Vælg flere)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Kunden kan vælge 0 eller flere</li>
                <li>• Perfekt til ekstra ingredienser</li>
                <li>• Hver har sin egen pris (typisk +pris)</li>
                <li>• Altid valgfrie</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Vigtige Noter</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Opret modifier grupper først under "Tilvalg & Varianter"</li>
              <li>• Link derefter produkter til de relevante grupper her</li>
              <li>• Test altid modifier flow på POS siden</li>
              <li>• Påkrævede modifiers skal vælges før produkt kan tilføjes til kurv</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
