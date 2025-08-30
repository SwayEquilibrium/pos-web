'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  useUnifiedRootCategories, 
  useUnifiedSubcategories, 
  useProductsByCategory 
} from '@/hooks/useMenu'
import { useCreateUnifiedCategory } from '@/hooks/useMenuManagement'
import { useCreateProduct } from '@/hooks/useMenuManagement'
import { DynamicIcon } from '@/lib/iconMapping'
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  FolderOpen, 
  Package, 
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavigationLevel {
  id: string | null
  name: string
  level: number
}

interface Category {
  id: string
  name: string
  parent_id?: string | null
  sort_index: number
  color?: string
  emoji?: string
  display_style?: string
  has_children: boolean
  product_count: number
  child_categories?: number
}

export default function MenuCardPage() {
  const router = useRouter()
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([
    { id: null, name: 'Menu Card', level: 0 }
  ])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    emoji: '📁',
    color: '#3B82F6'
  })
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    emoji: '🍽️',
    color: '#10B981'
  })

  const currentLevel = navigationStack[navigationStack.length - 1]
  const currentParentId = currentLevel.id

  // Data fetching
  const { data: rootCategories, isLoading: loadingRoot } = useUnifiedRootCategories()
  const { data: subcategories, isLoading: loadingSubcategories } = useUnifiedSubcategories(currentParentId)
  const { data: products, isLoading: loadingProducts } = useProductsByCategory(currentParentId || undefined)

  // Mutations
  const createCategory = useCreateUnifiedCategory()
  const createProduct = useCreateProduct()

  // Get current data to display
  const currentCategories = currentParentId === null ? rootCategories : subcategories
  const isLoading = currentParentId === null ? loadingRoot : loadingSubcategories

  // Navigation functions
  const navigateToCategory = (category: Category) => {
    setNavigationStack(prev => [...prev, {
      id: category.id,
      name: category.name,
      level: prev.length
    }])
  }

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(prev => prev.slice(0, -1))
    }
  }

  const navigateToRoot = () => {
    setNavigationStack([{ id: null, name: 'Menu Card', level: 0 }])
  }

  const navigateToBreadcrumb = (targetLevel: number) => {
    setNavigationStack(prev => prev.slice(0, targetLevel + 1))
  }

  // Handle create category
  const handleCreateCategory = async () => {
    if (!newCategoryForm.name.trim()) return

    try {
      await createCategory.mutateAsync({
        name: newCategoryForm.name,
        parent_id: currentParentId,
        emoji: newCategoryForm.emoji,
        color: newCategoryForm.color,
        display_style: 'emoji',
        sort_index: (currentCategories?.length || 0) + 1
      })
      
      setShowCreateCategory(false)
      setNewCategoryForm({ name: '', emoji: '📁', color: '#3B82F6' })
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  // Handle create product
  const handleCreateProduct = async () => {
    if (!newProductForm.name.trim() || !currentParentId) return

    try {
      await createProduct.mutateAsync({
        name: newProductForm.name,
        category_id: currentParentId,
        emoji: newProductForm.emoji,
        color: newProductForm.color,
        display_style: 'emoji',
        active: true
      })
      
      setShowCreateProduct(false)
      setNewProductForm({ name: '', price: '', emoji: '🍽️', color: '#10B981' })
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  // Determine what to show based on current level and data
  const showProducts = currentParentId && (!currentCategories || currentCategories.length === 0)
  const canCreateProduct = currentParentId !== null

  return (
    <div className="p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => router.push('/menu')} className="h-6 px-2">
              <Home className="w-3 h-3" />
            </Button>
            
            {navigationStack.map((level, index) => (
              <div key={level.level} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToBreadcrumb(index)}
                  className="h-6 px-2 text-xs"
                  disabled={index === navigationStack.length - 1}
                >
                  {level.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Current Level Title */}
          <div className="flex items-center gap-3">
            {navigationStack.length > 1 && (
              <Button variant="ghost" size="sm" onClick={navigateBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="w-8 h-8" />
              {currentLevel.name}
            </h1>
            
            {currentCategories && (
              <Badge variant="secondary">
                {currentCategories.length} categories
              </Badge>
            )}
            
            {showProducts && products && (
              <Badge variant="secondary">
                {products.length} products
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Create Category Button */}
          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {currentLevel.level === 0 ? 'Create Category' : 'Create Subcategory'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">
                  {currentLevel.level === 0 ? 'Create New Category' : `Create Subcategory`}
                </DialogTitle>
                {currentLevel.level > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Adding to: {currentLevel.name}
                  </p>
                )}
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Category Name */}
                <div className="space-y-3">
                  <Label htmlFor="categoryName" className="text-sm font-medium">
                    Category Name *
                  </Label>
                  <Input
                    id="categoryName"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Wine Card, Pizza, Desserts"
                    className="h-11"
                  />
                </div>
                
                {/* Visual Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Visual Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="categoryEmoji" className="text-sm font-medium">
                        Icon
                      </Label>
                      <Input
                        id="categoryEmoji"
                        value={newCategoryForm.emoji}
                        onChange={(e) => setNewCategoryForm(prev => ({ ...prev, emoji: e.target.value }))}
                        placeholder="📁"
                        className="h-11 text-center text-lg"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="categoryColor" className="text-sm font-medium">
                        Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="categoryColor"
                          type="color"
                          value={newCategoryForm.color}
                          onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                          className="h-11 w-full cursor-pointer"
                        />
                        <div 
                          className="w-11 h-11 rounded border-2 border-gray-200 flex items-center justify-center"
                          style={{ backgroundColor: newCategoryForm.color }}
                        >
                          <span className="text-white text-lg">{newCategoryForm.emoji}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Preview</h4>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: newCategoryForm.color }}
                      >
                        <span className="text-lg">{newCategoryForm.emoji}</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {newCategoryForm.name || 'Category Name'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          New category
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateCategory(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCategory} 
                    disabled={createCategory.isPending || !newCategoryForm.name.trim()}
                    className="flex-1"
                  >
                    {createCategory.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Product Button */}
          {canCreateProduct && (
            <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-xl font-semibold">Create Product</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Adding to: {currentLevel.name}
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Product Details */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="productName" className="text-sm font-medium">
                        Product Name *
                      </Label>
                      <Input
                        id="productName"
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Margherita Pizza, Caesar Salad"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="productPrice" className="text-sm font-medium">
                        Price (kr) *
                      </Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={newProductForm.price}
                        onChange={(e) => setNewProductForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Visual Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="productEmoji" className="text-sm font-medium">
                          Icon
                        </Label>
                        <Input
                          id="productEmoji"
                          value={newProductForm.emoji}
                          onChange={(e) => setNewProductForm(prev => ({ ...prev, emoji: e.target.value }))}
                          placeholder="🍽️"
                          className="h-11 text-center text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="productColor" className="text-sm font-medium">
                          Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="productColor"
                            type="color"
                            value={newProductForm.color}
                            onChange={(e) => setNewProductForm(prev => ({ ...prev, color: e.target.value }))}
                            className="h-11 w-full cursor-pointer"
                          />
                          <div 
                            className="w-11 h-11 rounded border-2 border-gray-200 flex items-center justify-center"
                            style={{ backgroundColor: newProductForm.color }}
                          >
                            <span className="text-white text-lg">{newProductForm.emoji}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Preview</h4>
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: newProductForm.color }}
                        >
                          <span className="text-lg">{newProductForm.emoji}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {newProductForm.name || 'Product Name'}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            {newProductForm.price ? `${newProductForm.price} kr` : '0 kr'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateProduct(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateProduct} 
                      disabled={createProduct.isPending || !newProductForm.name.trim()}
                      className="flex-1"
                    >
                      {createProduct.isPending ? 'Creating...' : 'Create Product'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : showProducts ? (
        // Show Products
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products in {currentLevel.name}</h2>
            {!products || products.length === 0 && (
              <p className="text-muted-foreground">
                This category is empty. Create products or subcategories.
              </p>
            )}
          </div>
          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: product.color || '#10B981' }}
                      >
                        <span>{product.emoji || '🍽️'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <p className="text-lg font-bold text-primary">{product.price} kr</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first product in {currentLevel.name}
                </p>
                <Button onClick={() => setShowCreateProduct(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Product
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Show Categories
        <div className="space-y-4">
          {currentCategories && currentCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCategories.map((category) => (
                <Card 
                  key={category.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => navigateToCategory(category)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      >
                        <DynamicIcon name={category.emoji || 'folder'} size={24} className="text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {category.has_children && (
                            <span className="flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" />
                              {category.child_categories || 0} subcategories
                            </span>
                          )}
                          
                          {category.product_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {category.product_count} products
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  {currentLevel.level === 0 
                    ? 'Create your first category to organize your menu'
                    : `Create subcategories under ${currentLevel.name} or add products directly`
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreateCategory(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
                  {canCreateProduct && (
                    <Button variant="outline" onClick={() => setShowCreateProduct(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
