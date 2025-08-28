'use client'
import { useState } from 'react'
import { useProducts, useProductSearch } from '@/hooks/useMenu'
import { useCategories } from '@/hooks/useMenu'
import ProductEditor from './ProductEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  ChefHat,
  Filter,
  Package,
  DollarSign
} from 'lucide-react'

interface ProductsPanelProps {
  selectedProduct: string | null
  onSelectProduct: (productId: string | null) => void
}

export default function ProductsPanel({ selectedProduct, onSelectProduct }: ProductsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  
  const { data: allProducts = [], isLoading: productsLoading } = useProducts()
  const { data: categories = [] } = useCategories()
  
  // Transform products to match the expected interface
  const transformProduct = (product: any) => ({
    product_id: product.id,
    name: product.name,
    description: product.description,
    category_name: categories.find(cat => cat.id === product.category_id)?.name,
    product_group_name: product.product_group_id ? 'Product Group' : undefined, // TODO: Implement product groups
    dine_in_price: 0, // TODO: Implement pricing
    takeaway_price: 0, // TODO: Implement pricing
    active: product.active
  })

  const transformedProducts = allProducts.map(transformProduct)
  
  // Filter products based on search and category
  const filteredProducts = transformedProducts.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !filterCategory || product.category_name === 
      categories.find(cat => cat.id === filterCategory)?.name
    
    return matchesSearch && matchesCategory
  })

  const displayProducts = searchTerm || filterCategory ? filteredProducts : transformedProducts

  const handleCreateNew = () => {
    onSelectProduct('new')
  }

  const handleSelectProduct = (productId: string) => {
    onSelectProduct(productId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Product List */}
      <div className="space-y-4">
        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Create New Button */}
            <Button 
              onClick={handleCreateNew}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Product
            </Button>
          </CardContent>
        </Card>

        {/* Product List */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({displayProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {productsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className={`h-16 bg-gray-200 rounded animate-pulse delay-${i * 75}`}></div>
                    </div>
                  ))}
                </div>
              ) : displayProducts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    {searchTerm || filterCategory ? 'No products found' : 'No products yet'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {searchTerm || filterCategory 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first product to get started'
                    }
                  </p>
                  {!searchTerm && !filterCategory && (
                    <Button onClick={handleCreateNew} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayProducts.map((product) => (
                    <div
                      key={product.product_id}
                      onClick={() => handleSelectProduct(product.product_id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:transform hover:scale-[1.01] hover:shadow-sm ${
                        selectedProduct === product.product_id ? 'bg-blue-50 border-r-2 border-blue-500 transform scale-[1.01] shadow-sm' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {product.category_name && (
                              <Badge variant="outline" className="text-xs">
                                {product.category_name}
                              </Badge>
                            )}
                            {product.product_group_name && (
                              <Badge variant="secondary" className="text-xs">
                                {product.product_group_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {product.dine_in_price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          {product.takeaway_price !== product.dine_in_price && (
                            <div className="text-xs text-gray-500 mt-1">
                              Takeaway: {product.takeaway_price?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Product Editor */}
      <div>
        {selectedProduct ? (
          <ProductEditor
            productId={selectedProduct === 'new' ? null : selectedProduct}
            onClose={() => onSelectProduct(null)}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Product
              </h3>
              <p className="text-gray-600 mb-6">
                Choose a product from the list to edit its details, pricing, and modifiers
              </p>
              <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
