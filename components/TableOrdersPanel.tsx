'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTableOrders } from '@/hooks/useTableOrders'
import { useRecordPayment } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  CreditCard, 
  Plus,
  Receipt,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'

interface TableOrdersPanelProps {
  tableId: string
  tableName: string
  onClose: () => void
}

export default function TableOrdersPanel({ tableId, tableName, onClose }: TableOrdersPanelProps) {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  
  const { data: tableOrders = [], isLoading } = useTableOrders(tableId)
  const recordPayment = useRecordPayment()

  const totalUnpaidAmount = tableOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const totalItems = tableOrders.reduce((sum, order) => sum + order.items_count, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'preparing':
        return <ChefHat className="w-4 h-4 text-blue-600" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'served':
        return <CheckCircle className="w-4 h-4 text-green-800" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      served: 'bg-green-200 text-green-900'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleAddOrder = () => {
    router.push(`/orders/${tableId}`)
  }

  const handlePayment = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = async (paymentDetails: any) => {
    if (!selectedOrderId) return

    try {
      const order = tableOrders.find(o => o.id === selectedOrderId)
      if (!order) return

      await recordPayment.mutateAsync({
        order_id: selectedOrderId,
        amount: paymentDetails.amount || order.total_amount,
        payment_method: paymentDetails.method || 'CASH',
        transaction_id: paymentDetails.reference,
        cash_received: paymentDetails.cash_received,
        change_given: paymentDetails.change,
        metadata: {
          customer_group: paymentDetails.customer_group_id,
          gift_card_balance: paymentDetails.gift_card_balance
        }
      })

      setShowPaymentModal(false)
      setSelectedOrderId(null)
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Betaling mislykkedes')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bord {tableName}</h2>
          <p className="text-muted-foreground">
            {tableOrders.length > 0 
              ? `${tableOrders.length} ordre${tableOrders.length !== 1 ? 'r' : ''} • ${totalItems} varer • ${totalUnpaidAmount.toFixed(2)} kr`
              : 'Ingen aktive ordrer'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Luk
          </Button>
          <Button onClick={handleAddOrder}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Vare
          </Button>
        </div>
      </div>

      {tableOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Ingen aktive ordrer</h3>
            <p className="text-muted-foreground mb-4">
              Dette bord har ingen ubetalte ordrer
            </p>
            <Button onClick={handleAddOrder}>
              <Plus className="w-4 h-4 mr-2" />
              Start første ordre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Orders */}
          {tableOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-primary text-sm">
                        {order.order_number}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Ordre {order.order_number}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Oprettet {format(new Date(order.created_at), 'HH:mm', { locale: da })}
                        {order.customer_name && ` • ${order.customer_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {order.total_amount.toFixed(2)} kr
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items_count} vare{order.items_count !== 1 ? 'r' : ''}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  {order.order_items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.qty}x</span>
                        <span className="text-sm">{item.product_name}</span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({item.modifiers.map(m => m.modifier_name).join(', ')})
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {(item.unit_price * item.qty).toFixed(2)} kr
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm text-muted-foreground">
                      Status: {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/orders/${tableId}`)}
                    >
                      Rediger
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handlePayment(order.id)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Betal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Total and Payment */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total at betale</h3>
                  <p className="text-muted-foreground">
                    {tableOrders.length} ordre{tableOrders.length !== 1 ? 'r' : ''} • {totalItems} vare{totalItems !== 1 ? 'r' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {totalUnpaidAmount.toFixed(2)} kr
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => handlePayment(tableOrders[0]?.id || '')}
                    disabled={tableOrders.length === 0}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Betal Alt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal would go here - for now just show a simple payment form */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Betal ordre</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Beløb</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  defaultValue={tableOrders.find(o => o.id === selectedOrderId)?.total_amount.toFixed(2)}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betalingsmetode</label>
                <select className="w-full p-2 border rounded">
                  <option value="CASH">Kontant</option>
                  <option value="CARD">Kort</option>
                  <option value="MOBILE">MobilePay</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Annuller
                </Button>
                <Button 
                  onClick={() => handlePaymentComplete({
                    amount: parseFloat((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || '0'),
                    method: (document.querySelector('select') as HTMLSelectElement)?.value || 'CASH'
                  })}
                  className="flex-1"
                >
                  Betal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
