'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTakeawayOrders } from '@/hooks/useTakeawayOrders'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Phone,
  User,
  Search,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'

interface DineInOrder {
  id: string
  table_name?: string
  room_name?: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  items_count: number
  created_at: string
  updated_at: string
  customer_name?: string
  type: 'dine_in'
}

export default function OrdersOverview() {
  const [activeTab, setActiveTab] = useState<'dine-in' | 'takeaway'>('dine-in')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch takeaway orders
  const { data: takeawayOrders = [], isLoading: takeawayLoading } = useTakeawayOrders()

  // Fetch dine-in orders
  const { data: dineInOrders = [], isLoading: dineInLoading } = useQuery({
    queryKey: ['dine-in-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          customer_name,
          type,
          table_id,
          tables!inner(
            name,
            rooms!inner(name)
          ),
          order_items!inner(
            id,
            quantity,
            unit_price
          )
        `)
        .eq('type', 'dine_in')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[dine-in-orders]', error)
        return []
      }

      return (data || []).map(order => {
        const items = order.order_items || []
        const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
        const table = order.tables
        const room = table?.rooms

        return {
          id: order.id,
          table_name: table?.name,
          room_name: room?.name,
          status: order.status,
          total_amount: totalAmount,
          items_count: items.length,
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_name: order.customer_name,
          type: 'dine_in' as const
        } as DineInOrder
      })
    }
  })

  const isLoading = takeawayLoading || dineInLoading
  const currentOrders = activeTab === 'dine-in' ? dineInOrders : takeawayOrders

  // Filter orders based on search and status
  const filteredOrders = currentOrders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ('table_name' in order && order.table_name?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'preparing':
        return <ChefHat className="w-4 h-4 text-blue-600" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-800" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const stats = {
    total: currentOrders.length,
    pending: currentOrders.filter(o => o.status === 'pending').length,
    preparing: currentOrders.filter(o => o.status === 'preparing').length,
    completed: currentOrders.filter(o => o.status === 'completed').length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders Overview</h2>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders from database...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders Overview</h2>
        <p className="text-gray-600">
          View and manage all {activeTab === 'dine-in' ? 'dine-in' : 'takeaway'} orders
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'dine-in' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dine-in')}
          className="flex items-center gap-2"
        >
          🪑 Dine-in Orders ({dineInOrders.length})
        </Button>
        <Button
          variant={activeTab === 'takeaway' ? 'default' : 'outline'}
          onClick={() => setActiveTab('takeaway')}
          className="flex items-center gap-2"
        >
          📦 Takeaway Orders ({takeawayOrders.length})
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 font-semibold">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChefHat className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-lg font-semibold">{stats.preparing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-semibold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${activeTab} orders...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'dine-in' ? 'Dine-in Orders' : 'Takeaway Orders'} ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No orders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Orders will appear here when created'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Order #{order.id.slice(-8)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.created_at), 'PPp', { locale: da })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {order.total_amount.toFixed(2)}€
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        {order.customer_name || 'Walk-in Customer'}
                      </span>
                    </div>

                    {'table_name' in order && order.table_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-600">
                          {order.room_name} - {order.table_name}
                        </span>
                      </div>
                    )}

                    {'customer_phone' in order && order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{order.customer_phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🛒</span>
                      <span className="text-gray-600">{order.items_count} items</span>
                    </div>
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
