'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit3, 
  Trash2,
  ArrowLeft,
  Tags,
  DollarSign,
  CheckSquare,
  Square
} from 'lucide-react'
import { enableModifierManagementV1 } from '@/lib/utils/modifierManagement'
import ModifierManagementV1 from '@/components/ModifierManagementV1'

interface ModifierGroup {
  id: string
  name: string
  type: 'variant' | 'addon'
  is_required: boolean
  items: ModifierItem[]
}

interface ModifierItem {
  id: string
  name: string
  price: number
  is_default: boolean
}

// No mock data - use real database or show empty states

export default function AddonsModifiersPage() {
  // Use enhanced version if feature flag is enabled
  if (enableModifierManagementV1) {
    return <ModifierManagementV1 />
  }

  // Fallback to original implementation (no mock data)
  const router = useRouter()
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState<'variant' | 'addon'>('addon')
  const [newGroupRequired, setNewGroupRequired] = useState(false)

  const createGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: ModifierGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      type: newGroupType,
      is_required: newGroupRequired,
      items: []
    }

    setModifierGroups(prev => [...prev, newGroup])
    setNewGroupName('')
    setNewGroupType('addon')
    setNewGroupRequired(false)
    setShowCreateGroup(false)
  }

  const deleteGroup = (groupId: string) => {
    if (confirm('Er du sikker på at du vil slette denne gruppe og alle dens items?')) {
      setModifierGroups(prev => prev.filter(group => group.id !== groupId))
    }
  }

  const addItemToGroup = (groupId: string) => {
    const itemName = prompt('Navn på item:')
    if (!itemName) return
    
    const priceStr = prompt('Pris (kan være negativ for rabat, 0 for gratis):')
    const price = parseFloat(priceStr || '0')

    const newItem: ModifierItem = {
      id: Date.now().toString(),
      name: itemName,
      price: price,
      is_default: false
    }

    setModifierGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, items: [...group.items, newItem] }
        : group
    ))
  }

  const deleteItem = (groupId: string, itemId: string) => {
    if (confirm('Slet dette item?')) {
      setModifierGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, items: group.items.filter(item => item.id !== itemId) }
          : group
      ))
    }
  }

  const toggleDefaultItem = (groupId: string, itemId: string) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            items: group.items.map(item => ({
              ...item,
              is_default: group.type === 'variant' 
                ? item.id === itemId  // For variants, only one can be default
                : item.id === itemId ? !item.is_default : item.is_default  // For addons, multiple can be default
            }))
          }
        : group
    ))
  }

  const getTypeIcon = (type: 'variant' | 'addon') => {
    return type === 'variant' ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />
  }

  const getTypeLabel = (type: 'variant' | 'addon') => {
    return type === 'variant' ? 'Vælg én' : 'Vælg flere'
  }

  const getTypeColor = (type: 'variant' | 'addon') => {
    return type === 'variant' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/menu')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Addons & Modifiers</h1>
              <p className="text-gray-600">Administrer tilvalg og modifikationer til dine produkter</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Ny Gruppe
          </Button>
        </div>

        {/* Create Group Form */}
        {showCreateGroup && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opret Ny Modifier Gruppe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gruppe Navn</label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="F.eks. Størrelse, Sovser, Tilbehør"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select 
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value as 'variant' | 'addon')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="addon">Addon (vælg flere)</option>
                    <option value="variant">Variant (vælg én)</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={newGroupRequired}
                      onChange={(e) => setNewGroupRequired(e.target.checked)}
                    />
                    <span className="text-sm font-medium">Påkrævet</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={createGroup} className="bg-green-600 hover:bg-green-700">
                  Opret Gruppe
                </Button>
                <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                  Annuller
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modifier Groups */}
        <div className="space-y-6">
          {modifierGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tags className="w-5 h-5 text-gray-600" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {group.name}
                        <Badge className={getTypeColor(group.type)}>
                          {getTypeIcon(group.type)}
                          <span className="ml-1">{getTypeLabel(group.type)}</span>
                        </Badge>
                        {group.is_required && (
                          <Badge variant="outline" className="text-red-600">
                            Påkrævet
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {group.items.length} items • 
                        {group.type === 'variant' ? ' Kunden skal vælge én option' : ' Kunden kan vælge flere options'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => addItemToGroup(group.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tilføj Item
                    </Button>
                    <Button 
                      onClick={() => deleteGroup(group.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {group.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tags className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Ingen items i denne gruppe</p>
                    <Button 
                      onClick={() => addItemToGroup(group.id)}
                      variant="outline"
                      className="mt-3"
                    >
                      Tilføj første item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-3 border rounded-lg ${item.is_default ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDefaultItem(group.id, item.id)}
                              className={`w-4 h-4 rounded ${item.is_default ? 'bg-yellow-500' : 'bg-gray-300'}`}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <Button 
                            onClick={() => deleteItem(group.id, item.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className={`text-sm font-mono ${
                            item.price > 0 ? 'text-green-600' : 
                            item.price < 0 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {item.price > 0 ? '+' : ''}{item.price.toFixed(2)} kr
                          </span>
                          {item.is_default && (
                            <Badge variant="outline" className="text-xs">Standard</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {modifierGroups.length === 0 && (
          <div className="text-center py-12">
            <Tags className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen modifier grupper endnu</h3>
            <p className="text-gray-600 mb-4">Opret grupper med tilvalg som størrelse, sovser og tilbehør</p>
            <Button 
              onClick={() => setShowCreateGroup(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opret Din Første Gruppe
            </Button>
          </div>
        )}

        {/* Info Panel */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Sådan fungerer Addons & Modifiers:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">🔘 Variants (Vælg én):</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Kunden skal vælge præcis én option</li>
                  <li>• F.eks. Størrelse: Lille, Normal, Stor</li>
                  <li>• Kan have forskellige priser</li>
                  <li>• Én option kan være standard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">☑️ Addons (Vælg flere):</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Kunden kan vælge 0 eller flere options</li>
                  <li>• F.eks. Sovser: Ketchup, Mayo, BBQ</li>
                  <li>• Hver option kan have sin egen pris</li>
                  <li>• Flere options kan være standard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
