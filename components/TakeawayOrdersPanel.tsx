'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TakeawayOrder {
  id: string
  order_number: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  created_at: string
  pickup_time?: string
  items_count: number
}

interface TakeawayOrdersPanelProps {
  orders: TakeawayOrder[]
  onCreateOrder: (customerName: string, customerPhone: string) => void
}

export default function TakeawayOrdersPanel({ orders, onCreateOrder }: TakeawayOrdersPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

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

  const handleCreateOrder = () => {
    if (customerName.trim()) {
      onCreateOrder(customerName.trim(), customerPhone.trim())
      setCustomerName('')
      setCustomerPhone('')
      setShowCreateForm(false)
    }
  }

  // Filter and sort orders - show active orders first
  const activeOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const completedOrders = orders.filter(order => 
    order.status === 'completed' || order.status === 'cancelled'
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            Takeaway Ordrer
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {activeOrders.length} aktive
            </Badge>
            <Button 
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              📦 Ny Takeaway
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Create Order Form */}
        {showCreateForm && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                  size="sm" 
                  onClick={handleCreateOrder}
                  disabled={!customerName.trim()}
                >
                  Opret Ordre
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuller
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Aktive Ordrer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeOrders.map(order => (
                <Link key={order.id} href={`/orders/takeaway/${order.id}`}>
                  <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-orange-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-lg">#{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_name || 'Anonym'}
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(order.status)} text-white border-0`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tid:</span>
                          <span>{formatTime(order.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dato:</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Varer:</span>
                          <span>{order.items_count} stk</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t pt-1 mt-2">
                          <span>Total:</span>
                          <span>{order.total_amount.toFixed(0)} kr</span>
                        </div>
                      </div>

                      {order.customer_phone && (
                        <div className="text-xs text-muted-foreground mt-2 truncate">
                          📞 {order.customer_phone}
                        </div>
                      )}

                      {order.pickup_time && (
                        <div className="text-xs text-orange-600 mt-1 font-medium">
                          Afhentning: {formatTime(order.pickup_time)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders (collapsed by default) */}
        {completedOrders.length > 0 && (
          <div>
            <details className="group">
              <summary className="cursor-pointer font-medium mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-2 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Afsluttede Ordrer ({completedOrders.length})
                </span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                {completedOrders.slice(0, 8).map(order => (
                  <Link key={order.id} href={`/orders/takeaway/${order.id}`}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer opacity-75 hover:opacity-100">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">#{order.order_number}</div>
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
                            <span className="font-medium">{order.total_amount.toFixed(0)} kr</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Ingen takeaway ordrer</h3>
            <p className="text-sm">Opret den første takeaway ordre</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
