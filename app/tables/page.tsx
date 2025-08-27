'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCreateRoom, useCreateTable, useUpdateTable, useDeleteRoom, useDeleteTable } from '@/hooks/useTableManagement'
import { useAllTableOrders } from '@/hooks/useTableOrders'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Search, X, Receipt, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import SimpleTableLayout from '@/components/SimpleTableLayout'
import AppLayout from '@/components/AppLayout'
import TableOrdersPanel from '@/components/TableOrdersPanel'
import TableFunctionsMenu from '@/components/TableFunctionsMenu'

export default function TablesPage() {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTableForOrders, setSelectedTableForOrders] = useState<{ id: string; name: string } | null>(null)
  const [selectedTable, setSelectedTable] = useState<{
    id: string
    name: string
    capacity: number
    hasOrders: boolean
    orderCount: number
    totalAmount: number
    isBooked?: boolean
    bookingTime?: string
    customerCount?: number
  } | null>(null)
  
  const { data: rooms } = useRooms()
  const { data: tables, refetch: refetchTables } = useTables()
  const { data: allTableOrders = [], refetch: refetchTableOrders } = useAllTableOrders()
  
  const createRoom = useCreateRoom()
  const createTable = useCreateTable()
  const updateTable = useUpdateTable()
  const deleteRoom = useDeleteRoom()
  const deleteTable = useDeleteTable()

  const [isEditMode, setIsEditMode] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [isListView, setIsListView] = useState(false)
  const tableLayoutRef = useRef<any>(null)

    // Real-time subscription to table orders
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    console.log('Setting up real-time subscription for table orders...')
    console.log('Supabase client:', supabase)
    
    // Subscribe to changes in the orders table
    const ordersSubscription = supabase
      .channel('table-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Real-time order change detected:', payload)
          // Refresh the table orders data immediately
          refetchTableOrders()
          refetchTables()
        }
      )
      .subscribe((status) => {
        console.log('Orders subscription status:', status)
      })

    // Subscribe to changes in the order_items table
    const orderItemsSubscription = supabase
      .channel('table-order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'order_items'
        },
        (payload: any) => {
          console.log('Real-time order item change detected:', payload)
          // Refresh the table orders data immediately
          refetchTableOrders()
          refetchTables()
        }
      )
      .subscribe((status) => {
        console.log('Order items subscription status:', status)
      })

    // Test subscription with a simple message
    const testChannel = supabase
      .channel('test-channel')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('Test broadcast received:', payload)
      })
      .subscribe((status) => {
        console.log('Test channel subscription status:', status)
      })

    // Send a test message to verify real-time is working
    setTimeout(() => {
      console.log('Sending test broadcast...')
      testChannel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Real-time test message' }
      })
    }, 2000)

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up real-time subscriptions...')
      supabase.removeChannel(ordersSubscription)
      supabase.removeChannel(orderItemsSubscription)
      supabase.removeChannel(testChannel)
    }
  }, [supabase, refetchTableOrders, refetchTables])

  // Also refresh when page becomes visible (fallback)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tables page became visible, refreshing data...')
        refetchTableOrders()
        refetchTables()
      }
    }

    const handleFocus = () => {
      console.log('Tables page gained focus, refreshing data...')
      refetchTableOrders()
      refetchTables()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetchTableOrders, refetchTables])



  // Get the effective room ID (selected room or first room)
  const effectiveRoomId = selectedRoomId || (rooms && rooms.length > 0 ? rooms[0].id : null)
  const selectedRoom = rooms?.find(room => room.id === effectiveRoomId)

  // Helper function to get table status and order info
  const getTableStatus = (tableId: string) => {
    console.log(`Getting status for table ${tableId}`)
    console.log('All table orders:', allTableOrders)
    
    const tableOrders = allTableOrders.filter(order => order.table_id === tableId)
    console.log(`Orders for table ${tableId}:`, tableOrders)
    
    if (tableOrders.length === 0) {
      console.log(`No orders found for table ${tableId}`)
      return { status: 'free', orders: 0, total: 0 }
    }
    
    // Filter for only unpaid orders (status !== 'paid' and status !== 'cancelled')
    const unpaidOrders = tableOrders.filter(order => 
      order.status !== 'paid' && order.status !== 'cancelled'
    )
    console.log(`Unpaid orders for table ${tableId}:`, unpaidOrders)
    
    if (unpaidOrders.length === 0) {
      console.log(`No unpaid orders for table ${tableId}`)
      return { status: 'free', orders: 0, total: 0 }
    }
    
    const totalAmount = unpaidOrders.reduce((sum, order) => sum + order.total_amount, 0)
    console.log(`Table ${tableId} status: occupied, ${unpaidOrders.length} orders, total: ${totalAmount}`)
    return { 
      status: 'occupied', 
      orders: unpaidOrders.length, 
      total: totalAmount 
    }
  }

  // Action handlers for the functions menu
  const handleMakeOrder = (tableId: string) => {
    router.push(`/orders/${tableId}`)
  }

  const handleSeeBill = (tableId: string) => {
    setSelectedTableForOrders({ id: tableId, name: tables?.find(t => t.id === tableId)?.name || '' })
  }

  const handleCloseTab = (tableId: string) => {
    setSelectedTableForOrders({ id: tableId, name: tables?.find(t => t.id === tableId)?.name || '' })
  }

  const handleMoveOrders = (fromTableId: string, toTableId: string) => {
    // TODO: Implement order moving logic
    console.log(`Moving orders from table ${fromTableId} to table ${toTableId}`)
    if (tables) {
      const fromTable = tables.find(t => t.id === fromTableId)
      const toTable = tables.find(t => t.id === toTableId)
      alert(`Flytter ordrer fra bord ${fromTable?.name} til bord ${toTable?.name}`)
    }
  }

  // Handle table selection
  const handleTableSelect = (table: any) => {
    const status = getTableStatus(table.id)
    setSelectedTable({
      id: table.id,
      name: table.name,
      capacity: table.capacity || 4,
      hasOrders: status.status === 'occupied',
      orderCount: status.orders,
      totalAmount: status.total,
      isBooked: false, // TODO: Add booking logic
      bookingTime: undefined,
      customerCount: undefined
    })
  }

    // Filter tables for selected room and search term
  const roomTables = tables?.filter(table => {
    const matchesRoom = !effectiveRoomId || table.room_id === effectiveRoomId
    const matchesSearch = !searchTerm || table.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRoom && matchesSearch
  }) || []

  // Table List View Component
  const TableListView = () => (
    <div className="space-y-4">
      {roomTables.map(table => {
        const status = getTableStatus(table.id)
        const tableRoom = rooms?.find(room => room.id === table.room_id)
        return (
          <Card 
            key={table.id} 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              selectedTable?.id === table.id ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
            onClick={() => handleTableSelect(table)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">{table.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tableRoom?.name} • {table.capacity || 4} personer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getTableStatus(table.id)
                    if (status.status === 'free') {
                      return (
                        <>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Ledig
                          </Badge>
                          <Button 
                            onClick={() => handleTableSelect(table)}
                            size="sm"
                            variant="outline"
                          >
                            Vælg
                          </Button>
                        </>
                      )
                    } else {
                      return (
                        <>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {status.orders} ordre{status.orders !== 1 ? 'r' : ''}
                          </Badge>
                          <Button 
                            onClick={() => handleTableSelect(table)}
                            size="sm"
                            variant="outline"
                          >
                            Vælg
                          </Button>
                        </>
                      )
                    }
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const content = (
          <div className="flex-1 flex flex-col">
      {/* Header */}
              <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedTableForOrders ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedTableForOrders(null)}
                  className="p-2"
                >
                  ← Tilbage til oversigt
                </Button>
                <h1 className="text-2xl font-bold">Bord {selectedTableForOrders.name}</h1>
              </>
            ) : (
              <>
                {/* Removed "Bordoversigt" text to free up space */}
                
                {/* Room Dropdown */}
                {rooms && rooms.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Lokale:</span>
                      <Select 
                        value={effectiveRoomId || 'none'} 
                        onValueChange={(value) => setSelectedRoomId(value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="w-48 bg-white border-2 border-blue-300 hover:border-blue-400">
                          <SelectValue placeholder="Vælg lokale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Alle lokaler</SelectItem>
                          {rooms.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: room.color || '#3B82F6' }}
                                ></div>
                                {room.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Current Room Display */}
                    {selectedRoom && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {selectedRoom.name}
                        </span>
                      </div>
                    )}
                    

                    

                  </div>
                )}
                
                {/* Table Status Bar */}
                {selectedRoom && (
                  <div className="flex items-center gap-4 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                    </div>
                    
                    {/* Available Tables */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">
                        Ledige: {roomTables.filter(table => getTableStatus(table.id).status === 'free').length}
                      </span>
                    </div>
                    
                    {/* Reserved Tables (placeholder for future booking system) */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-600">
                        Reserverede: 0
                      </span>
                    </div>
                    
                    {/* Occupied Tables */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-gray-600">
                        Optagne: {roomTables.filter(table => getTableStatus(table.id).status === 'occupied').length}
                      </span>
                    </div>
                    
                    {/* Total Tables */}
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                      <span className="text-sm font-medium text-gray-700">
                        Total: {roomTables.length} borde
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Table Controls - Moved from AppLayout */}
                {selectedRoom && (
                  <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700">Kontroller:</span>
                    </div>
                    
                    {/* Create/Edit Mode Toggle */}
                    {isEditMode ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditMode(false)}
                          className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                        >
                          🔄 Nulstil
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Call saveLayout on the SimpleTableLayout component
                            if (tableLayoutRef.current?.saveLayout) {
                              tableLayoutRef.current.saveLayout()
                            }
                            setIsEditMode(false)
                          }}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          💾 Gem
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditMode(true)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        ✏️ Rediger
                      </Button>
                    )}
                    
                    {/* Create Table Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkCreate(!showBulkCreate)}
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    >
                      ➕ Opret
                    </Button>
                    
                    <div className="h-6 w-px bg-blue-300 mx-2" />
                    
                    {/* View Toggle */}
                    <Button
                      variant={!isListView ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsListView(false)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 5 3-3 3 3" />
                      </svg>
                      2D
                    </Button>
                    <Button
                      variant={isListView ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsListView(true)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                      </svg>
                      Liste
                    </Button>
                  </div>
                )}

                {/* Clear Table Selection */}
                {selectedTable && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Valgt:</span>
                      <Badge variant="outline">
                        Bord {selectedTable.name}
                        {selectedTable.hasOrders && (
                          <span className="ml-1 text-orange-600">
                            • {selectedTable.orderCount} ordre{selectedTable.orderCount !== 1 ? 'r' : ''}
                          </span>
                        )}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTable(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Ryd valg
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Summary of occupied tables - only show when not viewing a specific table */}
          {!selectedTableForOrders && allTableOrders.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-600" />
                <span className="font-medium">{allTableOrders.length}</span>
                <span className="text-muted-foreground">aktive ordrer</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  {allTableOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)} kr
                </span>
                <span className="text-muted-foreground">at betale</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {selectedTableForOrders ? (
            <TableOrdersPanel
              tableId={selectedTableForOrders.id}
              tableName={selectedTableForOrders.name}
              onClose={() => setSelectedTableForOrders(null)}
            />
          ) : selectedRoom ? (
            isListView ? (
              <TableListView />
            ) : (
                      <div className="p-4 rounded-lg">
          <SimpleTableLayout
                tables={roomTables.map(table => {
                  const status = getTableStatus(table.id)
                  return {
                    id: table.id,
                    name: table.name,
                    x: (table as any).x || 0,
                    y: (table as any).y || 0,
                    width: 140,
                    height: 140,
                    room_id: table.room_id,
                    capacity: table.capacity,
                    hasOrders: status.status === 'occupied',
                    orderCount: status.orders,
                    totalAmount: status.total
                  }
                })}
                rooms={[{
                  id: selectedRoom.id,
                  name: selectedRoom.name,
                  color: selectedRoom.color || '#3B82F6'
                }]}
                selectedRoomId={effectiveRoomId}
                isEditMode={isEditMode}
                showBulkCreate={showBulkCreate}
                onSetEditMode={setIsEditMode}
                onSetShowBulkCreate={setShowBulkCreate}
                onTableSelect={handleTableSelect}
                selectedTableId={selectedTable?.id || null}
                onMakeOrder={handleMakeOrder}
                onSeeBill={handleSeeBill}
                onCloseTab={handleCloseTab}
                onMoveOrders={handleMoveOrders}
                onSaveLayout={() => {
                  // Refresh data after saving layout
                  refetchTables()
                  refetchTableOrders()
                }}
                onUpdateTable={(updatedTable) => {
                  updateTable.mutateAsync({
                    id: updatedTable.id,
                    name: updatedTable.name,
                    capacity: updatedTable.capacity,
                    x: updatedTable.x,
                    y: updatedTable.y
                  }).then(() => {
                    // Success - refresh the tables data
                    refetchTables()
                    console.log('Table updated successfully:', updatedTable.name)
                  }).catch(error => {
                    console.error('Failed to update table:', error)
                    // Show error to user
                    alert(`Fejl ved opdatering af bord: ${error.message}`)
                  })
                }}
                onCreateTable={(newTable) => {
                  createTable.mutateAsync({
                    name: newTable.name,
                    room_id: newTable.room_id,
                    capacity: newTable.capacity,
                    x: newTable.x,
                    y: newTable.y
                  })
                }}
                onDeleteTable={(tableId) => {
                  deleteTable.mutateAsync(tableId)
                }}
              />
                </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ingen lokaler fundet</h3>
              <p className="text-muted-foreground">Opret lokaler i Moduler → Bord Administration</p>
            </div>
          )}
        </div>
      </div>

      {/* No tables in room message */}
      {selectedRoom && roomTables.length === 0 && !isEditMode && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Ingen borde i dette lokale</h3>
          <p className="text-muted-foreground">
            {isEditMode ? 'Opret borde i redigeringstilstand' : 'Skift til redigeringstilstand for at oprette borde'}
          </p>
        </div>
      )}
    </div>
  )

    return (
    <div className="p-4 rounded-lg">
      {/* Back Button - Integrated into main container */}
      <div className="flex items-center justify-start mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-8 px-3 text-sm border hover:border-primary hover:text-primary cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tilbage
        </Button>
      </div>
      
      <div className="p-4 rounded-lg shadow-lg relative">
        <AppLayout
            showTableControls={true}
            isEditMode={isEditMode}
            onEditModeToggle={() => setIsEditMode(!isEditMode)}
            onCreateTable={() => setShowBulkCreate(!showBulkCreate)}
            onSaveLayout={() => {
              // Save layout logic will be handled by SimpleTableLayout
              setIsEditMode(false)
            }}
            onResetLayout={() => {
              // Reset layout logic will be handled by SimpleTableLayout
            }}
            isListView={isListView}
            onViewToggle={setIsListView}
          >
              {content}
      </AppLayout>
        </div>
      </div>
  )
}
