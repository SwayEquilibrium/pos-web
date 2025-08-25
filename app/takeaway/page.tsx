'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTakeawayOrders, useCreateTakeawayOrder, useUpdateTakeawayOrder } from '@/hooks/useTakeawayOrders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TakeawayOrdersPage() {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const { data: takeawayOrders } = useTakeawayOrders()
  const createTakeawayOrder = useCreateTakeawayOrder()
  const updateTakeawayOrder = useUpdateTakeawayOrder()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'preparing': return 'bg-blue-500 hover:bg-blue-600'
      case 'ready': return 'bg-green-500 hover:bg-green-600'
      case 'completed': return 'bg-gray-500 hover:bg-gray-600'
      case 'cancelled': return 'bg-red-500 hover:bg-red-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Afventer'
      case 'preparing': return 'Tilberedes'
      case 'ready': return 'Klar'
      case 'completed': return 'Afhentet'
      case 'cancelled': return 'Annulleret'
      default: return status
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'I dag'
    }
    
    return date.toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }

  const handleCreateOrder = async () => {
    if (customerName.trim()) {
      try {
        const orderId = await createTakeawayOrder.mutateAsync({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim()
        })
        // Navigate to the takeaway order page for editing
        router.push(`/orders/takeaway/${orderId}`)
      } catch (error) {
        console.error('Failed to create takeaway order:', error)
        alert('Fejl ved oprettelse af takeaway ordre')
      }
    }
  }

  const handleUpdateStatus = async (orderId: string, status: 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    try {
      await updateTakeawayOrder.mutateAsync({ id: orderId, status })
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Fejl ved opdatering af ordre status')
    }
  }

  // Filter and sort orders - show active orders first
  const activeOrders = takeawayOrders?.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []

  const completedOrders = takeawayOrders?.filter(order => 
    order.status === 'completed' || order.status === 'cancelled'
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbage til Menu
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>📦</span>
                Takeaway Ordrer
              </h1>
              <p className="text-sm text-muted-foreground">Administrer takeaway ordrer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {activeOrders.length} aktive ordrer
            </Badge>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              📦 Ny Takeaway Ordre
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Create Order Form */}
        {showCreateForm && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🆕</span>
                Opret Ny Takeaway Ordre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Kunde Navn *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="12 34 56 78"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateOrder}
                  disabled={!customerName.trim() || createTakeawayOrder.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {createTakeawayOrder.isPending ? 'Opretter...' : 'Opret & Rediger Ordre'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCustomerName('')
                    setCustomerPhone('')
                  }}
                >
                  Annuller
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🔥</span>
              Aktive Ordrer ({activeOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeOrders.map(order => (
                <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg text-orange-600">#{order.order_number}</div>
                        <div className="text-sm font-medium">
                          {order.customer_name || 'Anonym'}
                        </div>
                        {order.customer_phone && (
                          <div className="text-xs text-muted-foreground">
                            📞 {order.customer_phone}
                          </div>
                        )}
                      </div>
                      <Badge className={`text-xs ${getStatusColor(order.status)} text-white border-0`}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tid:</span>
                        <span>{formatTime(order.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Varer:</span>
                        <span>{order.items_count} stk</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base border-t pt-2">
                        <span>Total:</span>
                        <span className="text-orange-600">{order.total_amount.toFixed(0)} kr</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/orders/takeaway/${order.id}`)}
                      >
                        ✏️ Rediger Ordre
                      </Button>
                      
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          >
                            🔥 Start Tilberedning
                          </Button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                          >
                            ✅ Klar til Afhentning
                          </Button>
                        )}
                        
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-xs"
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                          >
                            📦 Afhentet
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 border-red-200"
                          onClick={() => {
                            if (confirm(`Annuller ordre #${order.order_number}?`)) {
                              handleUpdateStatus(order.id, 'cancelled')
                            }
                          }}
                        >
                          ❌
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <details className="group">
              <summary className="cursor-pointer font-semibold mb-4 text-lg hover:text-orange-600 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>📋</span>
                Afsluttede Ordrer ({completedOrders.length})
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {completedOrders.slice(0, 20).map(order => (
                  <Card key={order.id} className="hover:shadow-md transition-all duration-200 opacity-75 hover:opacity-100">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm">#{order.order_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.customer_name || 'Anonym'}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>{formatDate(order.created_at)} {formatTime(order.created_at)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>{order.items_count} varer</span>
                          <span>{order.total_amount.toFixed(0)} kr</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty State */}
        {(!takeawayOrders || takeawayOrders.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-medium mb-2">Ingen takeaway ordrer</h3>
              <p className="text-muted-foreground mb-4">Opret den første takeaway ordre for at komme i gang</p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                📦 Opret Første Ordre
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
