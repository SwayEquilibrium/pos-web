'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Database, Plus, RefreshCw, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DataStatusIndicator from './DataStatusIndicator.v1'

interface OrderScreenDataAwareProps {
  categories: any[] | undefined
  categoriesLoading: boolean
  categoriesError: Error | null
  products: any[] | undefined
  productsLoading: boolean
  productsError: Error | null
  selectedCategory: string | undefined
  onRefreshCategories: () => void
  onRefreshProducts: () => void
  children?: React.ReactNode
  className?: string
}

export default function OrderScreenDataAware({
  categories,
  categoriesLoading,
  categoriesError,
  products,
  productsLoading,
  productsError,
  selectedCategory,
  onRefreshCategories,
  onRefreshProducts,
  children,
  className = ''
}: OrderScreenDataAwareProps) {
  const router = useRouter()

  // Check if we have fundamental data issues
  const hasCategoriesError = !!categoriesError
  const hasProductsError = !!productsError
  const hasNoCategories = !categoriesLoading && !hasCategoriesError && (!categories || categories.length === 0)
  const hasNoProducts = selectedCategory && !productsLoading && !hasProductsError && (!products || products.length === 0)

  // If we have database setup issues, show setup screen
  if (hasCategoriesError || hasProductsError) {
    const isTableMissing = 
      categoriesError?.message?.includes('does not exist') || 
      productsError?.message?.includes('does not exist')

    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <Database size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Database Setup Required</h1>
            <p className="text-muted-foreground">
              The order system cannot function without proper database setup.
            </p>
          </div>

          <DataStatusIndicator
            title="Categories Data"
            dataType="categories"
            isLoading={categoriesLoading}
            error={categoriesError}
            data={categories}
            onRefresh={onRefreshCategories}
            createUrl="/admin/settings/menu"
            setupUrl="/admin/settings/database"
          />

          <DataStatusIndicator
            title="Products Data"
            dataType="products"
            isLoading={productsLoading}
            error={productsError}
            data={products}
            onRefresh={onRefreshProducts}
            createUrl="/admin/settings/menu"
            setupUrl="/admin/settings/database"
          />

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">What to do:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
                    <li>
                      <strong>Database Setup:</strong> Run the database migration scripts to create the required tables.
                    </li>
                    <li>
                      <strong>Create Categories:</strong> Go to Menu Management and create your product categories (e.g., "Hovedret", "Forret", etc.).
                    </li>
                    <li>
                      <strong>Add Products:</strong> Add products to each category (e.g., "Bøf" in "Hovedret").
                    </li>
                    <li>
                      <strong>Verify Data:</strong> Return here to confirm everything is working.
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => router.push('/admin/settings/menu')}
              size="lg"
            >
              <Settings size={16} className="mr-2" />
              Go to Menu Management
            </Button>
            <Button
              onClick={() => {
                onRefreshCategories()
                onRefreshProducts()
              }}
              variant="outline"
              size="lg"
            >
              <RefreshCw size={16} className="mr-2" />
              Check Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If no categories exist, show category creation screen
  if (hasNoCategories) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <Plus size={48} className="mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-bold mb-2">No Categories Found</h1>
            <p className="text-muted-foreground">
              You need to create product categories before you can take orders.
            </p>
          </div>

          <DataStatusIndicator
            title="Product Categories"
            dataType="categories"
            isLoading={categoriesLoading}
            error={categoriesError}
            data={categories}
            onRefresh={onRefreshCategories}
            createUrl="/admin/settings/menu"
          />

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Getting Started:</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <strong>Create Categories:</strong> Start by creating categories like "Hovedret", "Forret", "Dessert", etc.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <strong>Add Products:</strong> Add products to each category (e.g., "Bøf med løg" in "Hovedret").
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <strong>Take Orders:</strong> Once you have categories and products, you can start taking orders.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/admin/settings/menu')}
              size="lg"
            >
              <Plus size={16} className="mr-2" />
              Create Your First Category
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If category is selected but no products, show product creation prompt
  if (hasNoProducts && selectedCategory) {
    const categoryName = categories?.find(c => c.id === selectedCategory)?.name || 'this category'

    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <Plus size={48} className="mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-bold mb-2">No Products in "{categoryName}"</h1>
            <p className="text-muted-foreground">
              This category exists but has no products yet.
            </p>
          </div>

          <DataStatusIndicator
            title={`Products in "${categoryName}"`}
            dataType="products"
            isLoading={productsLoading}
            error={productsError}
            data={products}
            onRefresh={onRefreshProducts}
            createUrl="/admin/settings/menu"
          />

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Add Products to "{categoryName}":</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  Go to Menu Management to add products like "Bøf med løg", "Kylling", etc. to this category.
                </p>
                <p>
                  <strong>Note:</strong> Products must be marked as "active" to appear in the order screen.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => router.push('/admin/settings/menu')}
              size="lg"
            >
              <Plus size={16} className="mr-2" />
              Add Products to "{categoryName}"
            </Button>
            <Button
              onClick={onRefreshProducts}
              variant="outline"
              size="lg"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If we have data, render the normal order screen
  return (
    <div className={className}>
      {children}
    </div>
  )
}
