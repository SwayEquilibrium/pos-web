'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTableOrders } from '@/hooks/useTableOrders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  CreditCard, 
  Plus,
  Receipt,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react'

interface TableFunctionsMenuProps {
  selectedTable: {
    id: string
    name: string
    capacity: number
    hasOrders: boolean
    orderCount: number
    totalAmount: number
    isBooked?: boolean
    bookingTime?: string
    customerCount?: number
  } | null
  onMakeOrder: (tableId: string) => void
  onSeeBill: (tableId: string) => void
  onCloseTab: (tableId: string) => void
}

export default function TableFunctionsMenu({ 
  selectedTable, 
  onMakeOrder, 
  onSeeBill, 
  onCloseTab 
}: TableFunctionsMenuProps) {
  const router = useRouter()
  const { data: tableOrders = [] } = useTableOrders(selectedTable?.id || '')

  if (!selectedTable) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Vælg et bord</h3>
            <p className="text-muted-foreground">
              Klik på et bord i oversigten for at se funktioner
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalUnpaidAmount = tableOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const totalItems = tableOrders.reduce((sum, order) => sum + order.items_count, 0)

  return (
    <div className="p-4 space-y-4">
      {/* Table Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Bord {selectedTable.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kapacitet:</span>
            <Badge variant="outline">{selectedTable.capacity} personer</Badge>
          </div>
          
          {selectedTable.isBooked && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booket:</span>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                <Calendar className="w-3 h-3 mr-1" />
                {selectedTable.bookingTime}
              </Badge>
            </div>
          )}

          {selectedTable.hasOrders && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aktive ordrer:</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {selectedTable.orderCount} ordre{selectedTable.orderCount !== 1 ? 'r' : ''}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total at betale:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {selectedTable.totalAmount.toFixed(2)} kr
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={() => onMakeOrder(selectedTable.id)}
          className="w-full"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lav Ordre
        </Button>

        {selectedTable.hasOrders && (
          <>
            <Button 
              onClick={() => onSeeBill(selectedTable.id)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Se Regning
            </Button>

            <Button 
              onClick={() => onCloseTab(selectedTable.id)}
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Luk Regning / Betal
            </Button>
          </>
        )}

        {!selectedTable.hasOrders && (
          <Button 
            variant="outline"
            className="w-full"
            size="lg"
            disabled
          >
            <Receipt className="w-4 h-4 mr-2" />
            Ingen aktive ordrer
          </Button>
        )}
      </div>

      {/* Quick Status Overview */}
      {selectedTable.hasOrders && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-800">Ordre Oversigt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tableOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{order.order_number}</span>
                  <Badge variant="outline" size="sm">
                    {order.status}
                  </Badge>
                </div>
                <span className="font-medium">
                  {order.total_amount.toFixed(2)} kr
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-orange-200">
              <div className="flex items-center justify-between font-semibold text-orange-800">
                <span>Total:</span>
                <span>{totalUnpaidAmount.toFixed(2)} kr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

