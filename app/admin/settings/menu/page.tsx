'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useCategories, useProductsByCategory, useSubcategories } from '@/hooks/useCatalog'
import { useCreateCategory, useCreateProduct, useCopyProduct, useDeleteCategory, useDeleteProduct, useUpdateProduct } from '@/hooks/useMenuManagement'
import { useImageUpload } from '@/hooks/useImageUpload'
import VisualCustomizer, { type VisualSettings } from '@/components/VisualCustomizer'
import CategoryHierarchy, { CategoryBreadcrumbs } from '@/components/CategoryHierarchy'
import SortableList, { QuickSortButtons } from '@/components/SortableList'
import { type SortItem } from '@/hooks/useSorting'

type ViewMode = 'master-categories' | 'subcategories' | 'products'

export default function MenuManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('master-categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [navigationStack, setNavigationStack] = useState<Array<{id: string | null, name: string, type: 'master' | 'sub' | 'products'}>>([
    {id: null, name: 'Master Kategorier', type: 'master'}
  ])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showSortMode, setShowSortMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Only run hooks on client side to prevent SSR issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const { data: categories } = useCategories()
  const { data: products } = useProductsByCategory(selectedCategory || undefined)
  const { data: subcategories } = useSubcategories(selectedCategory)
  
  // Mutations - only initialize on client side
  const createCategory = isClient ? useCreateCategory() : null
  const createProduct = isClient ? useCreateProduct() : null
  const copyProduct = isClient ? useCopyProduct() : null
  const deleteCategory = isClient ? useDeleteCategory() : null
  const deleteProduct = isClient ? useDeleteProduct() : null
  const updateProduct = isClient ? useUpdateProduct() : null

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: selectedCategory,
    sort_index: 0
  })

  // Visual settings
  const [categoryVisuals, setCategoryVisuals] = useState<VisualSettings>({
    color: '#3B82F6',
    emoji: '📁',
    display_style: 'emoji'
  })

  const [productVisuals, setProductVisuals] = useState<VisualSettings>({
    color: '#10B981', 
    emoji: '🍽️',
    display_style: 'emoji'
  })

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_open_price: false,
    active: true
  })

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Kategori navn er påkrævet')
      return
    }

    try {
      if (createCategory) {
        await createCategory.mutateAsync({
          name: categoryForm.name,
          parent_id: selectedCategory,
          sort_index: categoryForm.sort_index
        })
        
        alert('Kategori oprettet! ✅')
        setShowCreateCategory(false)
        setCategoryForm({ name: '', description: '', parent_id: selectedCategory, sort_index: 0 })
      } else {
        alert('Kategori oprettelse er midlertidigt utilgængelig.')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Fejl ved oprettelse af kategori: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.category_id || !productForm.price) {
      alert('Produkt navn, kategori og pris er påkrævet')
      return
    }

    try {
      if (editingProduct) {
        if (updateProduct) {
          // Update existing product
          await updateProduct.mutateAsync({
            id: editingProduct.id,
            name: productForm.name,
            category_id: productForm.category_id,
            price: parseFloat(productForm.price),
            is_open_price: productForm.is_open_price,
            description: productForm.description,
            ...productVisuals
          })
          alert('Produkt opdateret! ✅')
        } else {
          alert('Produkt opdatering er midlertidigt utilgængelig.')
        }
      } else {
        if (createProduct) {
          // Create new product
          await createProduct.mutateAsync({
            name: productForm.name,
            category_id: productForm.category_id,
            price: parseFloat(productForm.price),
            is_open_price: productForm.is_open_price,
            description: productForm.description,
            ...productVisuals
          })
          alert('Produkt oprettet! ✅')
        } else {
          alert('Produkt oprettelse er midlertidigt utilgængelig.')
        }
      }
      
      setShowCreateProduct(false)
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        is_open_price: false,
        active: true
      })
      setProductVisuals({
        color: '#10B981',
        emoji: '🍽️',
        display_style: 'emoji'
      })
    } catch (error) {
      console.error('Error with product:', error)
      alert('Fejl ved produkt: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  // Product action handlers
  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      category_id: product.category_id,
      price: product.price?.toString() || '0',
      is_open_price: product.is_open_price || false,
      description: product.description || ''
    })
    setProductVisuals({
      color: product.color || '#10B981',
      emoji: product.emoji || '🍽️',
      display_style: product.display_style || 'emoji'
    })
    setShowCreateProduct(true)
  }

  const handleToggleProductStatus = async (product: any) => {
    try {
      if (updateProduct) {
        await updateProduct.mutateAsync({
          id: product.id,
          active: !product.active
        })
      } else {
        alert('Produktstatus ændring er midlertidigt utilgængelig.')
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      alert('Fejl ved ændring af produktstatus')
    }
  }

  const handleDeleteProduct = async (product: any) => {
    if (!confirm(`Er du sikker på at du vil slette "${product.name}"?`)) return
    
    try {
      if (deleteProduct) {
        await deleteProduct.mutateAsync(product.id)
      } else {
        alert('Produkt sletning er midlertidigt utilgængelig.')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Fejl ved sletning af produkt')
    }
  }

  // Navigation functions
  const navigateToSubcategories = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId)
    setViewMode('subcategories')
    setNavigationStack(prev => [...prev, {id: categoryId, name: categoryName, type: 'sub'}])
  }

  const navigateToProducts = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId)
    setViewMode('products')
    setNavigationStack(prev => [...prev, {id: categoryId, name: `${categoryName} - Produkter`, type: 'products'}])
  }

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      const newStack = navigationStack.slice(0, -1)
      const previous = newStack[newStack.length - 1]
      
      setNavigationStack(newStack)
      setSelectedCategory(previous.id)
      
      if (previous.type === 'master') {
        setViewMode('master-categories')
      } else if (previous.type === 'sub') {
        setViewMode('subcategories')
      } else {
        setViewMode('products')
      }
    }
  }

  const navigateToRoot = () => {
    setNavigationStack([{id: null, name: 'Master Kategorier', type: 'master'}])
    setSelectedCategory(null)
    setViewMode('master-categories')
  }

  const getCurrentViewTitle = () => {
    const current = navigationStack[navigationStack.length - 1]
    return current?.name || 'Menu Management'
  }

  const getCurrentViewData = () => {
    switch (viewMode) {
      case 'master-categories':
        return categories?.filter(cat => !cat.parent_id) || []
      case 'subcategories':
        return categories?.filter(cat => cat.parent_id === selectedCategory) || []
      case 'products':
        return products || []
      default:
        return []
    }
  }

  const getProductImage = (productName: string) => {
    const images: { [key: string]: string } = {
      'Caesar Salat': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&h=100&fit=crop',
      'Bruschetta': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=100&h=100&fit=crop',
      'Bøf med pommes': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&h=100&fit=crop',
      'Pasta Carbonara': 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=100&h=100&fit=crop',
      'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=100&h=100&fit=crop',
    }
    return images[productName] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Arrow */}
          {navigationStack.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage
            </Button>
          )}
          
          <div>
            <h1 className="text-3xl font-bold">{getCurrentViewTitle()}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {navigationStack.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>{item.name}</span>
                  {index < navigationStack.length - 1 && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
          
          <div className="flex gap-2">
            <Button 
              variant={showSortMode ? "default" : "outline"}
              onClick={() => setShowSortMode(!showSortMode)}
              className="flex items-center gap-2"
            >
              🔀 {showSortMode ? 'Afslut Sortering' : 'Sorter'}
            </Button>
            
            <Button 
              onClick={() => viewMode === 'products' ? setShowCreateProduct(true) : setShowCreateCategory(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {viewMode === 'products' ? '➕ Opret Produkt' : '➕ Opret Kategori'}
            </Button>
          </div>
        </div>

      {/* View Mode Navigation */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'master-categories' || viewMode === 'subcategories' ? 'default' : 'outline'}
          onClick={() => {
            setViewMode('master-categories')
            navigateToRoot()
          }}
        >
          📁 Kategorier
        </Button>
        <Button
          variant={viewMode === 'products' ? 'default' : 'outline'}
          onClick={() => setViewMode('products')}
          disabled={!selectedCategory}
        >
          🍽️ Produkter {selectedCategory && `(${categories?.find(c => c.id === selectedCategory)?.name})`}
        </Button>
      </div>

      {/* Categories View */}
      {(viewMode === 'master-categories' || viewMode === 'subcategories') && (
        <div className="space-y-4">
          {/* Create Category Form */}
          {showCreateCategory && (
            <Card>
              <CardHeader>
                <CardTitle>Opret Ny Kategori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Navn *</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Kategori navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortIndex">Sortering</Label>
                    <Input
                      id="sortIndex"
                      type="number"
                      value={categoryForm.sort_index}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_index: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentCategory">Overordnet Kategori</Label>
                  <select
                    id="parentCategory"
                    className="w-full px-3 py-2 border rounded-md"
                    value={categoryForm.parent_id || ''}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, parent_id: e.target.value || null }))}
                  >
                    <option value="">Root Kategori (øverste niveau)</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? '  └─ ' : ''}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Beskrivelse</Label>
                  <Input
                    id="categoryDescription"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCategory}>Gem Kategori</Button>
                  <Button variant="outline" onClick={() => setShowCreateCategory(false)}>Annuller</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories List with Visual Hierarchy and Sorting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {showSortMode ? '🔀 Sorter Kategorier' : 'Kategori Hierarki'}
              </h3>
              <Badge variant="secondary">
                {categories?.length || 0} kategorier total
              </Badge>
            </div>
            
            {showSortMode && categories && categories.length > 0 ? (
              /* Sortable Mode */
              <SortableList
                items={categories.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  sort_index: cat.sort_index,
                  parent_id: cat.parent_id
                }))}
                table="categories"
                renderItem={(item, index) => (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Visual indicator */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                            {categories?.find(c => c.id === item.id)?.emoji || '📁'}
                          </div>
                          
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            {item.parent_id && (
                              <p className="text-xs text-muted-foreground">
                                Under: {categories?.find(c => c.id === item.parent_id)?.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <QuickSortButtons
                            itemId={item.id}
                            currentIndex={index}
                            totalItems={categories.length}
                            table="categories"
                            allItems={categories.map(cat => ({
                              id: cat.id,
                              name: cat.name,
                              sort_index: cat.sort_index,
                              parent_id: cat.parent_id
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                showControls={true}
                className="mt-4"
              />
            ) : (
              /* Normal Hierarchy View */
              <div className="space-y-2">
                {categories?.map(category => (
                  <div key={category.id} className="relative group">
                    <CategoryHierarchy
                      category={{
                        ...category,
                        level: category.parent_id ? 1 : 0,
                        full_path: category.parent_id ? 
                          `${categories?.find(c => c.id === category.parent_id)?.name || 'Parent'} → ${category.name}` : 
                          category.name
                      }}
                      showPath={!!category.parent_id}
                      showCounts={true}
                      onClick={(cat) => {
                        const hasSubcategories = categories?.some(c => c.parent_id === cat.id)
                        if (hasSubcategories) {
                          navigateToSubcategories(cat.id, cat.name)
                        } else {
                          navigateToProducts(cat.id, cat.name)
                        }
                      }}
                      className="hover:bg-blue-50 group-hover:bg-blue-50"
                    />
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-8">
                        ✏️
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Slet kategorien "${category.name}"?`)) {
                            if (deleteCategory) {
                              deleteCategory.mutate(category.id)
                            } else {
                              alert('Kategorisletning er midlertidigt utilgængelig.')
                            }
                          }
                        }}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!categories || categories.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-4xl mb-4">📁</div>
                    <p>Ingen kategorier oprettet endnu</p>
                    <p className="text-sm mt-2">Opret din første kategori for at komme i gang</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products View */}
      {viewMode === 'products' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label>Filter efter kategori:</Label>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">Alle kategorier</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {selectedCategory && (
                  <Badge variant="secondary">
                    {categories?.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Product Form */}
          {showCreateProduct && (
            <Card>
              <CardHeader>
                <CardTitle>{editingProduct ? 'Rediger Produkt' : 'Opret Nyt Produkt'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Navn *</Label>
                    <Input
                      id="productName"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Produkt navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCategory">Kategori *</Label>
                    <select
                      id="productCategory"
                      className="w-full px-3 py-2 border rounded-md"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                    >
                      <option value="">Vælg kategori</option>
                      {categories?.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Pris (kr) *</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.is_open_price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, is_open_price: e.target.checked }))}
                      />
                      Åben pris
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Beskrivelse</Label>
                  <Input
                    id="productDescription"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>
                <VisualCustomizer
                  currentSettings={productVisuals}
                  onChange={setProductVisuals}
                  type="product"
                />
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateProduct}>
                    {editingProduct ? 'Opdater Produkt' : 'Gem Produkt'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCreateProduct(false)
                    setEditingProduct(null)
                    setProductForm({
                      name: '',
                      description: '',
                      price: '',
                      category_id: '',
                      is_open_price: false,
                      active: true
                    })
                  }}>Annuller</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products List with Sorting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {showSortMode ? '🔀 Sorter Produkter' : 'Produkter'}
                {selectedCategory && (
                  <span className="text-sm text-muted-foreground ml-2">
                    i {categories?.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
              </h3>
              <Badge variant="secondary">
                {products?.length || 0} produkter
              </Badge>
            </div>
            
            {showSortMode && products && products.length > 0 ? (
              /* Sortable Mode for Products */
              <SortableList
                items={products.map(prod => ({
                  id: prod.id,
                  name: prod.name,
                  sort_index: prod.sort_index || 0,
                  parent_id: prod.category_id
                }))}
                table="products"
                renderItem={(item, index) => {
                  const product = products.find(p => p.id === item.id)
                  return (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Visual indicator */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                              {product?.emoji || '🍽️'}
                            </div>
                            
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {product?.is_open_price ? 'Åben pris' : `${product?.price} kr.`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={product?.active ? 'default' : 'secondary'} className="text-xs">
                              {product?.active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                            
                            <QuickSortButtons
                              itemId={item.id}
                              currentIndex={index}
                              totalItems={products.length}
                              table="products"
                              allItems={products.map(prod => ({
                                id: prod.id,
                                name: prod.name,
                                sort_index: prod.sort_index || 0,
                                parent_id: prod.category_id
                              }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }}
                showControls={true}
                className="mt-4"
              />
            ) : (
              /* Normal Grid View for Products - Smaller and More Compact */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products?.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Smaller Image */}
                    <div className="aspect-square bg-muted relative">
                      <img 
                        src={getProductImage(product.name)} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge 
                        variant={product.active ? 'default' : 'secondary'} 
                        className="absolute top-2 right-2 text-xs"
                      >
                        {product.active ? '✓' : '✕'}
                      </Badge>
                    </div>
                    
                    {/* Compact Content */}
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                      <p className="text-sm font-bold text-primary mb-2">
                        {product.is_open_price ? 'Åben pris' : `${product.price?.toFixed(0)} kr`}
                      </p>
                      
                      {/* Action Buttons - Smaller */}
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          ✏️
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs flex-1"
                          onClick={() => handleToggleProductStatus(product)}
                        >
                          {product.active ? '🚫' : '✅'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 flex-1"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {(!products || products.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {selectedCategory 
                    ? 'Ingen produkter i denne kategori'
                    : 'Ingen produkter fundet'
                  }
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowCreateProduct(true)}
                >
                  Opret første produkt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
