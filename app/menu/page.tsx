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
  Eye, 
  EyeOff,
  Copy,
  Settings,
  ChefHat,
  Tags,
  ArrowLeft
} from 'lucide-react'

interface Menu {
  id: string
  name: string
  description: string
  is_active: boolean
  is_draft: boolean
  categories_count: number
  products_count: number
  created_at: string
}

// Mock data - replace with actual API calls
const mockMenus: Menu[] = [
  {
    id: '1',
    name: 'Hovedmenu',
    description: 'Vores standard menu med alle retter',
    is_active: true,
    is_draft: false,
    categories_count: 8,
    products_count: 45,
    created_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sommermenu 2024',
    description: 'Sæsonmenu med friske sommerretter',
    is_active: false,
    is_draft: true,
    categories_count: 5,
    products_count: 23,
    created_at: '2024-03-20'
  }
]

export default function MenuManagement() {
  const router = useRouter()
  const [menus, setMenus] = useState<Menu[]>(mockMenus)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [newMenuName, setNewMenuName] = useState('')
  const [newMenuDescription, setNewMenuDescription] = useState('')

  const createMenu = () => {
    if (!newMenuName.trim()) return

    const newMenu: Menu = {
      id: Date.now().toString(),
      name: newMenuName,
      description: newMenuDescription,
      is_active: false,
      is_draft: true,
      categories_count: 0,
      products_count: 0,
      created_at: new Date().toISOString().split('T')[0]
    }

    setMenus(prev => [...prev, newMenu])
    setNewMenuName('')
    setNewMenuDescription('')
    setShowCreateMenu(false)
  }

  const activateMenu = (menuId: string) => {
    setMenus(prev => prev.map(menu => ({
      ...menu,
      is_active: menu.id === menuId,
      is_draft: menu.id === menuId ? false : menu.is_draft
    })))
  }

  const toggleDraft = (menuId: string) => {
    setMenus(prev => prev.map(menu => 
      menu.id === menuId 
        ? { ...menu, is_draft: !menu.is_draft }
        : menu
    ))
  }

  const duplicateMenu = (menu: Menu) => {
    const duplicatedMenu: Menu = {
      ...menu,
      id: Date.now().toString(),
      name: `${menu.name} (Kopi)`,
      is_active: false,
      is_draft: true,
      created_at: new Date().toISOString().split('T')[0]
    }

    setMenus(prev => [...prev, duplicatedMenu])
  }

  const deleteMenu = (menuId: string) => {
    if (confirm('Er du sikker på at du vil slette denne menu?')) {
      setMenus(prev => prev.filter(menu => menu.id !== menuId))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600">Administrer dine menuer, kategorier og produkter</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/menu/addons-modifiers')}
              className="flex items-center gap-2"
            >
              <Tags className="w-4 h-4" />
              Addons & Modifiers
            </Button>
            <Button 
              onClick={() => setShowCreateMenu(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Ny Menu
            </Button>
          </div>
        </div>

        {/* Create Menu Form */}
        {showCreateMenu && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opret Ny Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Menu Navn</label>
                  <Input
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="F.eks. Vintermenu 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                  <Input
                    value={newMenuDescription}
                    onChange={(e) => setNewMenuDescription(e.target.value)}
                    placeholder="Kort beskrivelse af menuen"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={createMenu} className="bg-green-600 hover:bg-green-700">
                  Opret Menu
                </Button>
                <Button variant="outline" onClick={() => setShowCreateMenu(false)}>
                  Annuller
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className={`relative ${menu.is_active ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5" />
                      {menu.name}
                      {menu.is_active && (
                        <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                      )}
                      {menu.is_draft && (
                        <Badge variant="outline">Kladde</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-900">{menu.categories_count}</div>
                      <div className="text-blue-600">Kategorier</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-900">{menu.products_count}</div>
                      <div className="text-purple-600">Produkter</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => router.push(`/menu/${menu.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Rediger Menu
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {!menu.is_active && (
                        <Button 
                          onClick={() => activateMenu(menu.id)}
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Aktiver
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => toggleDraft(menu.id)}
                        variant="outline"
                        size="sm"
                        className={menu.is_draft ? "text-orange-600" : "text-gray-600"}
                      >
                        {menu.is_draft ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {menu.is_draft ? 'Udgiv' : 'Kladde'}
                      </Button>
                      
                      <Button 
                        onClick={() => duplicateMenu(menu)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Kopier
                      </Button>
                      
                      <Button 
                        onClick={() => deleteMenu(menu.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Slet
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Oprettet: {new Date(menu.created_at).toLocaleDateString('da-DK')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {menus.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen menuer endnu</h3>
            <p className="text-gray-600 mb-4">Kom i gang ved at oprette din første menu</p>
            <Button 
              onClick={() => setShowCreateMenu(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opret Din Første Menu
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}