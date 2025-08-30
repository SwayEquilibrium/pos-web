'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  useSalesSummary,
  useDailyCategorySales,
  useProductPerformance,
  useModifierAnalytics,
  useCategoryHierarchySales
} from '@/hooks/useSalesAnalytics'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download
} from 'lucide-react'

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })

  // Data fetching
  const { data: summary, isLoading: loadingSummary } = useSalesSummary(dateRange)
  const { data: categorySales, isLoading: loadingCategories } = useDailyCategorySales(dateRange)
  const { data: productPerformance, isLoading: loadingProducts } = useProductPerformance(10)
  const { data: modifierAnalytics, isLoading: loadingModifiers } = useModifierAnalytics()
  const { data: hierarchySales, isLoading: loadingHierarchy } = useCategoryHierarchySales()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Sales Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive sales tracking across products, categories, and modifiers
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
            />
          </div>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {loadingSummary ? '...' : formatCurrency(summary?.total_revenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {loadingSummary ? '...' : (summary?.total_orders || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-2xl font-bold">
                  {loadingSummary ? '...' : (summary?.total_items || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  {loadingSummary ? '...' : formatCurrency(summary?.avg_order_value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modifier Revenue</p>
                <p className="text-2xl font-bold">
                  {loadingSummary ? '...' : formatCurrency(summary?.modifier_revenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sales breakdown by category hierarchy
            </p>
          </CardHeader>
          <CardContent>
            {loadingHierarchy ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {hierarchySales?.slice(0, 8).map((category) => (
                  <div key={category.category_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {'→ '.repeat(category.level)}{category.category_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {category.full_path}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.items_sold} items
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (category.total_revenue / (hierarchySales[0]?.total_revenue || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <p className="text-sm text-muted-foreground">
              Best selling products by revenue
            </p>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {productPerformance?.slice(0, 8).map((product, index) => (
                  <div key={product.product_id} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.total_quantity_sold} sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modifier Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier Popularity & Revenue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track which modifiers customers choose most and their revenue impact
          </p>
        </CardHeader>
        <CardContent>
          {loadingModifiers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group modifiers by group */}
              {Object.entries(
                modifierAnalytics?.reduce((groups, modifier) => {
                  const group = modifier.modifier_group_name
                  if (!groups[group]) groups[group] = []
                  groups[group].push(modifier)
                  return groups
                }, {} as Record<string, typeof modifierAnalytics>) || {}
              ).map(([groupName, modifiers]) => (
                <div key={groupName} className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modifiers.slice(0, 6).map((modifier) => (
                      <Card key={modifier.modifier_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{modifier.modifier_name}</h5>
                              <Badge variant="secondary">
                                {formatPercentage(modifier.selection_percentage)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Times Selected</p>
                                <p className="font-bold">{modifier.times_selected}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Revenue</p>
                                <p className="font-bold">{formatCurrency(modifier.total_revenue)}</p>
                              </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, modifier.selection_percentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales by Category</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily breakdown showing category performance over time
          </p>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {categorySales?.slice(0, 20).map((sale) => (
                <div key={`${sale.sale_date}-${sale.category_id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{sale.category_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {new Date(sale.sale_date).toLocaleDateString('da-DK')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {sale.category_path}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(sale.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.items_sold} items • {sale.order_count} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

