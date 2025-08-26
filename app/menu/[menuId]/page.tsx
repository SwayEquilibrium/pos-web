'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit3, 
  Trash2,
  ArrowLeft,
  FolderOpen,
  Package,
  ChevronRight,
  Eye,
  DollarSign
} from 'lucide-react'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct 
} from '@/hooks/useMenuManagement'
import { showToast } from '@/lib/toast'

export default function MenuEditor() {
  const router = useRouter()
  const { menuId } = useParams()
  
  // State first
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Get real data from database
  const { data: dbCategories, isLoading: categoriesLoading } = useCategories()
  const { data: selectedCategoryProducts, isLoading: productsLoading } = useProductsByCategory(selectedCategory)

  // Mutation hooks
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()
  
  // Use database data directly
  const categories = dbCategories || []
  const products = selectedCategoryProducts || []
  
  // Derived data
  const rootCategories = categories.filter(cat => cat.parent_id === null)
  const subcategories = selectedCategory 
    ? categories.filter(cat => cat.parent_id === selectedCategory)
    : []
  const selectedCategoryInfo = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)
    : null
  
  // Debug logging
  console.log('[MenuEditor] Selected category:', selectedCategory)
  console.log('[MenuEditor] Categories:', categories)
  console.log('[MenuEditor] Root categories:', rootCategories)
  console.log('[MenuEditor] Products for category:', products)
  console.log('[MenuEditor] Products loading:', productsLoading)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [newCategoryDisplayStyle, setNewCategoryDisplayStyle] = useState<'emoji' | 'color' | 'image'>('emoji')
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('')
  
  const [newProductName, setNewProductName] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductIsOpenPrice, setNewProductIsOpenPrice] = useState(false)
  const [newProductEmoji, setNewProductEmoji] = useState('🍽️')
  const [newProductColor, setNewProductColor] = useState('#10B981')
  const [newProductDisplayStyle, setNewProductDisplayStyle] = useState<'emoji' | 'color' | 'image'>('emoji')
  const [newProductImageUrl, setNewProductImageUrl] = useState('')

  // Removed duplicate declarations - already defined above

  const createCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName,
        description: newCategoryDescription,
        parent_id: selectedCategory,
        sort_index: categories.length,
        emoji: newCategoryEmoji,
        color: newCategoryColor,
        display_style: newCategoryDisplayStyle,
        image_url: newCategoryImageUrl
      })
      
      showToast.success('Kategori oprettet!')
      
      // Reset form
      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryEmoji('📁')
      setNewCategoryColor('#3B82F6')
      setNewCategoryDisplayStyle('emoji')
      setNewCategoryImageUrl('')
      setShowCreateCategory(false)
    } catch (error) {
      console.error('Failed to create category:', error)
      showToast('Fejl ved oprettelse af kategori', 'error')
    }
  }

  const createProduct = async () => {
    console.log('Creating product...', {
      name: newProductName,
      category: selectedCategory,
      price: newProductPrice
    })
    
    // Validation with user feedback
    if (!newProductName.trim()) {
      showToast.error('Produktnavn er påkrævet')
      return
    }
    
    if (!selectedCategory) {
      showToast.error('Vælg en kategori først')
      return
    }
    
    if (!newProductIsOpenPrice && !newProductPrice.trim()) {
      showToast.error('Indtast en pris eller vælg "Åben pris"')
      return
    }

    try {
      const productData = {
        name: newProductName,
        description: newProductDescription,
        price: newProductIsOpenPrice ? 0 : (parseFloat(newProductPrice) || 0),
        category_id: selectedCategory,
        is_open_price: newProductIsOpenPrice,
        emoji: newProductEmoji,
        color: newProductColor,
        display_style: newProductDisplayStyle,
        image_url: newProductImageUrl
      }
      
      console.log('Sending product data:', productData)
      
      await createProductMutation.mutateAsync(productData)
      
      showToast.success('Produkt oprettet!')
      
      // Reset form
      setNewProductName('')
      setNewProductDescription('')
      setNewProductPrice('')
      setNewProductIsOpenPrice(false)
      setNewProductEmoji('🍽️')
      setNewProductColor('#10B981')
      setNewProductDisplayStyle('emoji')
      setNewProductImageUrl('')
      setShowCreateProduct(false)
    } catch (error) {
      console.error('Failed to create product:', error)
      showToast.error('Fejl ved oprettelse af produkt')
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (confirm('Slet denne kategori og alle dens produkter?')) {
      try {
        await deleteCategoryMutation.mutateAsync(categoryId)
        showToast('Kategori slettet!', 'success')
      } catch (error) {
        console.error('Failed to delete category:', error)
        showToast('Fejl ved sletning af kategori', 'error')
      }
    }
  }

  const deleteProduct = async (productId: string) => {
    if (confirm('Slet dette produkt?')) {
      try {
        await deleteProductMutation.mutateAsync(productId)
        showToast('Produkt slettet!', 'success')
      } catch (error) {
        console.error('Failed to delete product:', error)
        showToast('Fejl ved sletning af produkt', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Menu Editor</h1>
              <p className="text-gray-600">Rediger kategorier og produkter</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/menu/addons-modifiers')}
            >
              Addons & Modifiers
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Kategorier
                  <Button 
                    onClick={() => setShowCreateCategory(true)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rootCategories.map((category) => (
                    <div key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>{category.products_count + category.subcategories_count}</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>

                      {/* Subcategories */}
                      {categories.filter(cat => cat.parent_id === category.id).map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => setSelectedCategory(subcat.id)}
                          className={`w-full text-left p-2 ml-4 rounded-lg border transition-all ${
                            selectedCategory === subcat.id
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-3 h-3" />
                              <span className="text-sm">{subcat.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">{subcat.products_count}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedCategoryInfo ? (
              <div className="space-y-6">
                {/* Category Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5" />
                          {selectedCategoryInfo.name}
                        </CardTitle>
                        <p className="text-gray-600">{selectedCategoryInfo.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {selectedCategoryInfo.products_count === 0 && selectedCategoryInfo.subcategories_count === 0 && (
                          <Button 
                            onClick={() => setShowCreateCategory(true)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Underkategori
                          </Button>
                        )}
                        <Button 
                          onClick={() => setShowCreateProduct(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Produkt
                        </Button>
                        <Button 
                          onClick={() => deleteCategory(selectedCategoryInfo.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Subcategories */}
                {subcategories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Underkategorier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subcategories.map((subcat) => (
                          <div key={subcat.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{subcat.name}</h3>
                              <Button 
                                onClick={() => deleteCategory(subcat.id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{subcat.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{subcat.products_count} produkter</span>
                              <Button 
                                onClick={() => setSelectedCategory(subcat.id)}
                                size="sm"
                                variant="outline"
                              >
                                Åbn
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Produkter ({products.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">Ingen produkter i denne kategori</p>
                        <Button 
                          onClick={() => setShowCreateProduct(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tilføj første produkt
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => (
                          <div key={product.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-medium">{product.name}</h3>
                                  <div className="flex items-center gap-1 text-green-600">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="font-mono">{product.price.toFixed(2)} kr</span>
                                  </div>
                                  {!product.is_available && (
                                    <Badge variant="outline" className="text-red-600">
                                      Ikke tilgængelig
                                    </Badge>
                                  )}
                                  {product.modifiers_count > 0 && (
                                    <Badge variant="outline">
                                      {product.modifiers_count} modifiers
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{product.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => router.push(`/menu/${menuId}/product/${product.id}`)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => deleteProduct(product.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Vælg en kategori</h3>
                  <p className="text-gray-600">Vælg en kategori fra listen til venstre for at se og redigere produkter</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Category Modal */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {selectedCategory ? 'Opret Underkategori' : 'Opret Kategori'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Navn</label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="F.eks. Forretter, Hovedretter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                    <Input
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Kort beskrivelse"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button onClick={createCategory} className="bg-green-600 hover:bg-green-700">
                    Opret
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                    Annuller
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Product Modal */}
        {showCreateProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Opret Produkt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Category indicator */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Kategori</label>
                    {selectedCategory ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {categories.find(cat => cat.id === selectedCategory)?.name || 'Ukendt kategori'}
                        </Badge>
                        <span className="text-sm text-blue-600">✓ Valgt</span>
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">
                        ⚠️ Vælg en kategori først i venstre side
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Navn <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="F.eks. Bøf med løg"
                      className={!newProductName.trim() ? 'border-red-300' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beskrivelse</label>
                    <Input
                      value={newProductDescription}
                      onChange={(e) => setNewProductDescription(e.target.value)}
                      placeholder="Kort beskrivelse af retten"
                    />
                  </div>
                  
                  {/* Open Price Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="openPrice"
                      checked={newProductIsOpenPrice}
                      onChange={(e) => setNewProductIsOpenPrice(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="openPrice" className="text-sm font-medium">
                      Åben pris (variabel pris)
                    </label>
                  </div>
                  
                  {/* Price field - disabled if open price */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pris (kr) {newProductIsOpenPrice && <span className="text-gray-500">(deaktiveret - åben pris)</span>}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder={newProductIsOpenPrice ? "Pris indtastes ved bestilling" : "0.00"}
                      disabled={newProductIsOpenPrice}
                      className={newProductIsOpenPrice ? 'bg-gray-100 cursor-not-allowed' : ''}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Create product button clicked!')
                      createProduct()
                    }} 
                    disabled={!newProductName.trim() || !selectedCategory || (!newProductIsOpenPrice && !newProductPrice.trim())}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Opret
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateProduct(false)}>
                    Annuller
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
