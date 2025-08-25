'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimpleBackButton } from '@/components/BackNavigation'
import { 
  useModifierGroups, 
  useModifiersByGroup, 
  useCreateModifierGroup, 
  useCreateModifier,
  useUpdateModifierGroup,
  useUpdateModifier,
  type ModifierGroup,
  type Modifier
} from '@/hooks/useModifiers'

type ActiveTab = 'groups' | 'modifiers'

export default function ModifiersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('groups')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateModifier, setShowCreateModifier] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null)
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null)
  const [tempGroupId] = useState('temp-' + Date.now())
  const [groupModifiers, setGroupModifiers] = useState<{ [key: string]: Array<{ name: string, price: number }> }>({})

  const { data: groups } = useModifierGroups()
  const { data: modifiers } = useModifiersByGroup(selectedGroup || undefined)
  
  const createGroup = useCreateModifierGroup()
  const createModifier = useCreateModifier()
  const updateGroup = useUpdateModifierGroup()
  const updateModifier = useUpdateModifier()

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    type: 'addon' as 'variant' | 'addon',
    is_required: false,
    sort_index: 0
  })

  const [modifierForm, setModifierForm] = useState({
    name: '',
    description: '',
    price_adjustment: 0,
    sort_index: 0
  })

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      type: 'addon',
      is_required: false,
      sort_index: 0
    })
  }

  const resetModifierForm = () => {
    setModifierForm({
      name: '',
      description: '',
      price_adjustment: 0,
      sort_index: 0
    })
  }

  const addModifierToGroup = (groupId: string) => {
    setGroupModifiers(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), { name: '', price: 0 }]
    }))
  }

  const updateGroupModifier = (groupId: string, index: number, field: 'name' | 'price', value: string | number) => {
    setGroupModifiers(prev => ({
      ...prev,
      [groupId]: prev[groupId]?.map((mod, idx) => 
        idx === index ? { ...mod, [field]: value } : mod
      ) || []
    }))
  }

  const removeModifierFromGroup = (groupId: string, index: number) => {
    setGroupModifiers(prev => ({
      ...prev,
      [groupId]: prev[groupId]?.filter((_, idx) => idx !== index) || []
    }))
  }

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Gruppe navn er påkrævet')
      return
    }

    const modifiersForGroup = groupModifiers[tempGroupId] || []

    if (modifiersForGroup.length === 0) {
      alert('Du skal tilføje mindst én modifier til gruppen')
      return
    }

    if (modifiersForGroup.some(mod => !mod.name.trim())) {
      alert('Alle modifiers skal have et navn')
      return
    }

    try {
      // First create the group
      const newGroup = await createGroup.mutateAsync({
        name: groupForm.name,
        description: groupForm.description || undefined,
        type: groupForm.type,
        is_required: groupForm.is_required,
        sort_index: groupForm.sort_index
      })
      
      // Then create all modifiers for this group
      for (let i = 0; i < modifiersForGroup.length; i++) {
        const modifier = modifiersForGroup[i]
        await createModifier.mutateAsync({
          group_id: newGroup.id,
          name: modifier.name,
          price_adjustment: modifier.price,
          sort_index: i
        })
      }
      
      alert(`Modifier gruppe "${groupForm.name}" med ${modifiersForGroup.length} modifiers oprettet! ✅`)
      setShowCreateGroup(false)
      resetGroupForm()
      setGroupModifiers(prev => {
        const newState = { ...prev }
        delete newState[tempGroupId]
        return newState
      })
    } catch (error) {
      console.error('Error creating modifier group:', error)
      alert('Fejl ved oprettelse af modifier gruppe: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupForm.name.trim()) return

    try {
      await updateGroup.mutateAsync({
        id: editingGroup.id,
        name: groupForm.name,
        description: groupForm.description || undefined,
        type: groupForm.type,
        is_required: groupForm.is_required,
        sort_index: groupForm.sort_index
      })
      
      alert('Modifier gruppe opdateret! ✅')
      setEditingGroup(null)
      resetGroupForm()
    } catch (error) {
      console.error('Error updating modifier group:', error)
      alert('Fejl ved opdatering af modifier gruppe: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleCreateModifier = async () => {
    if (!modifierForm.name.trim() || !selectedGroup) {
      alert('Modifier navn og gruppe er påkrævet')
      return
    }

    try {
      await createModifier.mutateAsync({
        group_id: selectedGroup,
        name: modifierForm.name,
        description: modifierForm.description || undefined,
        price_adjustment: modifierForm.price_adjustment,
        sort_index: modifierForm.sort_index
      })
      
      alert('Modifier oprettet! ✅')
      setShowCreateModifier(false)
      resetModifierForm()
    } catch (error) {
      console.error('Error creating modifier:', error)
      alert('Fejl ved oprettelse af modifier: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleUpdateModifier = async () => {
    if (!editingModifier || !modifierForm.name.trim()) return

    try {
      await updateModifier.mutateAsync({
        id: editingModifier.id,
        name: modifierForm.name,
        description: modifierForm.description || undefined,
        price_adjustment: modifierForm.price_adjustment,
        sort_index: modifierForm.sort_index
      })
      
      alert('Modifier opdateret! ✅')
      setEditingModifier(null)
      resetModifierForm()
    } catch (error) {
      console.error('Error updating modifier:', error)
      alert('Fejl ved opdatering af modifier: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const startEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description || '',
      type: group.type,
      is_required: group.is_required,
      sort_index: group.sort_index
    })
  }

  const startEditModifier = (modifier: Modifier) => {
    setEditingModifier(modifier)
    setModifierForm({
      name: modifier.name,
      description: modifier.description || '',
      price_adjustment: modifier.price_adjustment,
      sort_index: modifier.sort_index
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modifier System</h1>
          <p className="text-muted-foreground">Administrer tilvalg og varianter til produkter</p>
        </div>
        <Button 
          onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : setShowCreateModifier(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={activeTab === 'modifiers' && !selectedGroup}
        >
          {activeTab === 'groups' ? '📁 Opret Gruppe' : '🏷️ Opret Modifier'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{groups?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Modifier Grupper</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {groups?.filter(g => g.type === 'variant').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Variant Grupper</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {groups?.filter(g => g.type === 'addon').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Addon Grupper</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'groups' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveTab('groups')
            setSelectedGroup(null)
          }}
        >
          📁 Grupper
        </Button>
        <Button
          variant={activeTab === 'modifiers' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('modifiers')}
          disabled={!selectedGroup}
        >
          🏷️ Modifiers
        </Button>
      </div>

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          {/* Create Group Form */}
          {(showCreateGroup || editingGroup) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingGroup ? 'Rediger Modifier Gruppe' : 'Opret Modifier Gruppe'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Gruppe Navn *</Label>
                    <Input
                      id="group-name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="f.eks. Størrelse, Ekstra, Sauce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-type">Type *</Label>
                    <select
                      id="group-type"
                      className="w-full px-3 py-2 border rounded-md"
                      value={groupForm.type}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, type: e.target.value as 'variant' | 'addon' }))}
                    >
                      <option value="variant">Variant (vælg én)</option>
                      <option value="addon">Addon (vælg flere)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-description">Beskrivelse</Label>
                  <Input
                    id="group-description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="group-required"
                    checked={groupForm.is_required}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, is_required: e.target.checked }))}
                  />
                  <Label htmlFor="group-required">Påkrævet valg</Label>
                </div>

                {/* Modifiers for this group */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {groupForm.type === 'variant' ? 'Varianter (vælg én)' : 'Add-ons (vælg flere)'}
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addModifierToGroup(tempGroupId)}
                    >
                      ➕ Tilføj {groupForm.type === 'variant' ? 'Variant' : 'Add-on'}
                    </Button>
                  </div>

                  {(groupModifiers[tempGroupId] || []).map((modifier, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Navn</Label>
                        <Input
                          placeholder="f.eks. Stor, Ekstra Ost"
                          value={modifier.name}
                          onChange={(e) => updateGroupModifier(tempGroupId, index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Pris ændring (DKK)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={modifier.price}
                          onChange={(e) => updateGroupModifier(tempGroupId, index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeModifierFromGroup(tempGroupId, index)}
                          className="w-full"
                        >
                          🗑️ Fjern
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(groupModifiers[tempGroupId] || []).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Ingen {groupForm.type === 'variant' ? 'varianter' : 'add-ons'} tilføjet endnu</p>
                      <p className="text-sm">Klik "➕ Tilføj" for at oprette din første</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                    disabled={createGroup.isPending || updateGroup.isPending}
                  >
                    {(createGroup.isPending || updateGroup.isPending) ? '⏳ Gemmer...' : (editingGroup ? 'Opdater Gruppe' : 'Gem Gruppe')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateGroup(false)
                      setEditingGroup(null)
                      resetGroupForm()
                      setGroupModifiers(prev => {
                        const newState = { ...prev }
                        delete newState[tempGroupId]
                        return newState
                      })
                    }}
                  >
                    Annuller
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Groups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups?.map(group => (
              <Card key={group.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{group.name}</h3>
                    <div className="flex gap-1">
                      <Badge variant={group.type === 'variant' ? 'default' : 'secondary'}>
                        {group.type === 'variant' ? 'Variant' : 'Addon'}
                      </Badge>
                      {group.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Påkrævet
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEditGroup(group)}
                    >
                      ✏️ Rediger
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedGroup(group.id)
                        setActiveTab('modifiers')
                      }}
                    >
                      🏷️ Modifiers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modifiers Tab */}
      {activeTab === 'modifiers' && selectedGroup && (
        <div className="space-y-6">
          {/* Selected Group Info */}
          {selectedGroup && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {groups?.find(g => g.id === selectedGroup)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {groups?.find(g => g.id === selectedGroup)?.description}
                    </p>
                  </div>
                  <Badge variant={groups?.find(g => g.id === selectedGroup)?.type === 'variant' ? 'default' : 'secondary'}>
                    {groups?.find(g => g.id === selectedGroup)?.type === 'variant' ? 'Variant' : 'Addon'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Modifier Form */}
          {(showCreateModifier || editingModifier) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingModifier ? 'Rediger Modifier' : 'Opret Modifier'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modifier-name">Modifier Navn *</Label>
                    <Input
                      id="modifier-name"
                      value={modifierForm.name}
                      onChange={(e) => setModifierForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="f.eks. Stor, Ekstra Ost, Ketchup"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modifier-price">Pris Ændring (DKK)</Label>
                    <Input
                      id="modifier-price"
                      type="number"
                      step="0.01"
                      value={modifierForm.price_adjustment}
                      onChange={(e) => setModifierForm(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Positiv for tillæg, negativ for rabat, 0 for gratis
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modifier-description">Beskrivelse</Label>
                  <Input
                    id="modifier-description"
                    value={modifierForm.description}
                    onChange={(e) => setModifierForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={editingModifier ? handleUpdateModifier : handleCreateModifier}
                    disabled={createModifier.isPending || updateModifier.isPending}
                  >
                    {(createModifier.isPending || updateModifier.isPending) ? '⏳ Gemmer...' : (editingModifier ? 'Opdater Modifier' : 'Gem Modifier')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModifier(false)
                      setEditingModifier(null)
                      resetModifierForm()
                    }}
                  >
                    Annuller
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modifiers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modifiers?.map(modifier => (
              <Card key={modifier.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{modifier.name}</h3>
                    <Badge variant={modifier.price_adjustment === 0 ? 'secondary' : modifier.price_adjustment > 0 ? 'default' : 'outline'}>
                      {modifier.price_adjustment === 0 
                        ? 'Gratis' 
                        : modifier.price_adjustment > 0
                          ? `+${modifier.price_adjustment.toFixed(0)} kr.`
                          : `${modifier.price_adjustment.toFixed(0)} kr.`
                      }
                    </Badge>
                  </div>
                  
                  {modifier.description && (
                    <p className="text-sm text-muted-foreground mb-3">{modifier.description}</p>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => startEditModifier(modifier)}
                    className="w-full"
                  >
                    ✏️ Rediger
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Eksempler på Modifier Grupper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">🍕 Pizza Størrelse (Variant)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>• Lille (25cm)</span>
                  <span className="text-red-600">-15 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Medium (30cm)</span>
                  <span className="text-muted-foreground">0 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Stor (35cm)</span>
                  <span className="text-green-600">+25 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Familie (40cm)</span>
                  <span className="text-green-600">+45 kr</span>
                </div>
              </div>
              <Badge variant="destructive" className="mt-2 text-xs">Påkrævet</Badge>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">🧀 Pizza Ekstra (Add-on)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>• Ekstra Ost</span>
                  <span className="text-green-600">+15 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Pepperoni</span>
                  <span className="text-green-600">+20 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Champignon</span>
                  <span className="text-green-600">+12 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Ekstra Tomat</span>
                  <span className="text-muted-foreground">0 kr</span>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 text-xs">Valgfri</Badge>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-3">☕ Kaffe Størrelse (Variant)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>• Lille (20cl)</span>
                  <span className="text-red-600">-8 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Standard (30cl)</span>
                  <span className="text-muted-foreground">0 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>• Stor (40cl)</span>
                  <span className="text-green-600">+12 kr</span>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 text-xs">Valgfri</Badge>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Tips til Modifier Opsætning</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
              <div>
                <h5 className="font-medium mb-1">🏷️ Variants (Vælg én):</h5>
                <ul className="space-y-1">
                  <li>• Størrelse, mængde, type</li>
                  <li>• Kun én kan vælges</li>
                  <li>• Kan være påkrævet</li>
                  <li>• Pris kan være +/- eller 0</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-1">➕ Add-ons (Vælg flere):</h5>
                <ul className="space-y-1">
                  <li>• Ekstra ingredienser, tilbehør</li>
                  <li>• Flere kan vælges</li>
                  <li>• Altid valgfri</li>
                  <li>• Typisk +pris eller gratis</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
