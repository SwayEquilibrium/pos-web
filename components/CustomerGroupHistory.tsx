'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  ShoppingBag,
  Clock,
  Banknote,
  Smartphone,
  Gift,
  Building
} from 'lucide-react'
import { 
  useCustomerGroupPurchaseHistory, 
  useCustomerGroupAnalytics,
  type CustomerGroup 
} from '@/hooks/useCustomerGroups'

interface CustomerGroupHistoryProps {
  group: CustomerGroup
  onClose: () => void
}

export default function CustomerGroupHistory({ group, onClose }: CustomerGroupHistoryProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
  
  const { data: purchases, isLoading: loadingPurchases } = useCustomerGroupPurchaseHistory(group.id)
  const { data: analytics, isLoading: loadingAnalytics } = useCustomerGroupAnalytics(group.id)

  const getPaymentMethodIcon = (code: string) => {
    switch (code) {
      case 'CASH': return <Banknote className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'DANKORT': return <CreditCard className="w-4 h-4" />
      case 'MOBILE_PAY': return <Smartphone className="w-4 h-4" />
      case 'GIFT_CARD': return <Gift className="w-4 h-4" />
      case 'BANK_TRANSFER': return <Building className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} kr`
  }

  if (loadingPurchases || loadingAnalytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Button>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: group.color }}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-gray-600">Purchase History & Analytics</p>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_purchases || 0}</div>
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.total_spent || 0)}</div>
            <p className="text-xs text-muted-foreground">Gross revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Avg. Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.average_order_value || 0)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              Discounts Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.total_discount_given || 0)}</div>
            <p className="text-xs text-muted-foreground">Total savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Chart */}
      {analytics?.monthly_spending && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Spending Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.monthly_spending.map((month: any) => {
                const maxAmount = Math.max(...analytics.monthly_spending.map((m: any) => m.amount))
                const percentage = (month.amount / maxAmount) * 100
                
                return (
                  <div key={month.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span className="text-muted-foreground">{month.orders} orders</span>
                      <span className="font-medium">{formatCurrency(month.amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Purchase History
            <Badge variant="outline" className="ml-2">
              {purchases?.length || 0} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases && purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase: any) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedPurchase(purchase)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {formatDate(purchase.purchase_date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {purchase.order_id}
                          </span>
                        </div>
                        
                        {purchase.customer_name && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {purchase.customer_name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(purchase.total_amount - purchase.discount_applied)}
                          </div>
                          {purchase.discount_applied > 0 && (
                            <div className="text-xs text-green-600">
                              -{formatCurrency(purchase.discount_applied)} discount
                            </div>
                          )}
                        </div>
                        
                        {purchase.payment_transactions?.[0] && (
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(purchase.payment_transactions[0].payment_type_code)}
                            <span className="text-xs text-gray-500">
                              {purchase.payment_transactions[0].payment_type_code}
                            </span>
                          </div>
                        )}
                        
                        <Badge variant="outline" className="text-xs">
                          {purchase.items_count} items
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchases yet</h3>
              <p className="text-gray-600">
                Purchases made with this customer group will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Purchase Details - {selectedPurchase.order_id}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Purchase Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Date & Time</div>
                  <div className="text-sm">{formatDate(selectedPurchase.purchase_date)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Customer</div>
                  <div className="text-sm">{selectedPurchase.customer_name || 'Anonymous'}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Items</div>
                  <div className="text-sm">{selectedPurchase.items_count} items</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Order ID</div>
                  <div className="text-sm font-mono">{selectedPurchase.order_id}</div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedPurchase.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Group Discount ({group.name}):</span>
                    <span>-{formatCurrency(selectedPurchase.discount_applied)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(selectedPurchase.total_amount - selectedPurchase.discount_applied)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedPurchase.payment_transactions?.map((payment: any) => (
                <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    {getPaymentMethodIcon(payment.payment_type_code)}
                    Payment Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Payment ID:</div>
                      <div className="font-mono">{payment.payment_id}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500">Method:</div>
                      <div>{payment.payment_type_code}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500">Amount:</div>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500">Processed:</div>
                      <div>{formatDate(payment.processed_at)}</div>
                    </div>
                    
                    {payment.reference_number && (
                      <div className="col-span-2">
                        <div className="text-gray-500">Reference:</div>
                        <div className="font-mono">{payment.reference_number}</div>
                      </div>
                    )}
                    
                    {payment.notes && (
                      <div className="col-span-2">
                        <div className="text-gray-500">Notes:</div>
                        <div>{payment.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedPurchase(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
