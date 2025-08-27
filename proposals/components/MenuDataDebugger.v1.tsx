'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Database, Eye, EyeOff } from 'lucide-react'
import { 
  useCategoriesEnhanced, 
  useProductsByCategoryEnhanced, 
  useAllProductsDebug,
  useDatabaseVerification,
  useRefreshCatalogData
} from '../hooks/useCatalogEnhanced.v1'

interface MenuDataDebuggerProps {
  selectedCategory?: string | null
  className?: string
}

export default function MenuDataDebugger({ selectedCategory, className = '' }: MenuDataDebuggerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Enhanced hooks
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategoriesEnhanced()
  const { data: products, isLoading: productsLoading, error: productsError } = useProductsByCategoryEnhanced(selectedCategory || undefined)
  const { data: allProducts } = useAllProductsDebug()
  const { data: dbVerification } = useDatabaseVerification()
  const { refreshAll, refreshProducts } = useRefreshCatalogData()

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
        >
          <Database size={16} className="mr-2" />
          Menu Debug
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto ${className}`}>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database size={20} />
              Menu Data Debugger
            </CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff size={16} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Database Verification */}
          <div>
            <h4 className="font-medium mb-2">Database Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={dbVerification?.categoriesTable ? "default" : "destructive"}>
                  Categories Table: {dbVerification?.categoriesTable ? "✓" : "✗"}
                </Badge>
                <span className="text-muted-foreground">({dbVerification?.categoriesCount || 0} records)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={dbVerification?.productsTable ? "default" : "destructive"}>
                  Products Table: {dbVerification?.productsTable ? "✓" : "✗"}
                </Badge>
                <span className="text-muted-foreground">({dbVerification?.productsCount || 0} records)</span>
              </div>
              {dbVerification?.errors && dbVerification.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertCircle size={14} />
                    <span className="font-medium">Errors:</span>
                  </div>
                  {dbVerification.errors.map((error, idx) => (
                    <div key={idx} className="text-xs">{error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Categories Status */}
          <div>
            <h4 className="font-medium mb-2">Categories</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={categoriesLoading ? "secondary" : categories ? "default" : "destructive"}>
                  {categoriesLoading ? "Loading..." : `${categories?.length || 0} categories`}
                </Badge>
              </div>
              {categoriesError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                  Error: {categoriesError.message}
                </div>
              )}
              {categories && categories.length > 0 && (
                <div className="mt-1">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600">Show categories</summary>
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2">
                          <span className={selectedCategory === cat.id ? "font-bold text-blue-600" : ""}>
                            {cat.name}
                          </span>
                          {selectedCategory === cat.id && <Badge variant="outline" className="text-xs">Selected</Badge>}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* Products Status */}
          <div>
            <h4 className="font-medium mb-2">Products {selectedCategory && `(${categories?.find(c => c.id === selectedCategory)?.name})`}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={productsLoading ? "secondary" : products ? "default" : "destructive"}>
                  {productsLoading ? "Loading..." : `${products?.length || 0} products`}
                </Badge>
                {!selectedCategory && (
                  <span className="text-muted-foreground text-xs">Select category to see products</span>
                )}
              </div>
              {productsError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                  Error: {productsError.message}
                </div>
              )}
              {products && products.length > 0 && (
                <div className="mt-1">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600">Show products</summary>
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                      {products.map(prod => (
                        <div key={prod.id} className="flex items-center justify-between">
                          <span>{prod.name}</span>
                          <span className="text-muted-foreground">{prod.price}kr</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
              {selectedCategory && products?.length === 0 && !productsLoading && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-xs">
                  <div className="flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>No products found in this category!</span>
                  </div>
                  <div className="mt-1">
                    This could mean:
                    <ul className="list-disc list-inside ml-2">
                      <li>No products added to this category yet</li>
                      <li>Products exist but are marked as inactive</li>
                      <li>Database sync issue</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Products Debug */}
          {allProducts && allProducts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">All Products in Database</h4>
              <div className="text-sm">
                <Badge variant="outline">{allProducts.length} total products</Badge>
                <details className="text-xs mt-1">
                  <summary className="cursor-pointer text-blue-600">Show all products</summary>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {allProducts.map(prod => (
                      <div key={prod.id} className="flex items-center justify-between text-xs">
                        <span className={prod.active ? "" : "line-through text-red-500"}>
                          {prod.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant={prod.active ? "default" : "destructive"} className="text-xs">
                            {prod.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => refreshAll()}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw size={14} className="mr-1" />
              Refresh All
            </Button>
            {selectedCategory && (
              <Button
                onClick={() => refreshProducts(selectedCategory)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw size={14} className="mr-1" />
                Refresh Products
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
            <strong>How to use:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Check database status shows green checkmarks</li>
              <li>Verify categories are loading properly</li>
              <li>Select a category and check if products appear</li>
              <li>Use refresh buttons if data seems outdated</li>
              <li>Check browser console for detailed logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
