'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCreateRoom, useCreateTable, useUpdateTable, useDeleteRoom, useDeleteTable } from '@/hooks/useTableManagement'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import SimpleTableLayout from '@/components/SimpleTableLayout'


export default function TablesPage() {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isListView, setIsListView] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  
  const { data: rooms } = useRooms()
  const { data: tables } = useTables()
  
  // Table management hooks
  const createTable = useCreateTable()
  const updateTable = useUpdateTable()
  const deleteTable = useDeleteTable()

  // Auto-select first room if none selected
  const effectiveRoomId = selectedRoomId || rooms?.[0]?.id || null
  const selectedRoom = rooms?.find(room => room.id === effectiveRoomId)
  
  // Filter tables for selected room
  const roomTables = tables?.filter(table => table.room_id === effectiveRoomId) || []

  const TableListView = () => (
    <div className="space-y-4">
      {roomTables.map(table => (
        <Card key={table.id} className="cursor-pointer hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-semibold text-primary">{table.name}</span>
                </div>
                <div>
                  <h3 className="font-medium">{table.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Kapacitet: {table.capacity} personer
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ledig
                </Badge>
                <Button 
                  onClick={() => router.push(`/orders/${table.id}`)}
                  size="sm"
                >
                  Opret Ordre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const content = (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Bordoversigt</h1>
          
          {/* Room Dropdown */}
          {rooms && rooms.length > 0 && (
            <Select 
              value={effectiveRoomId || 'none'} 
              onValueChange={(value) => setSelectedRoomId(value === 'none' ? null : value)}
            >
              <SelectTrigger className="w-48">
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {selectedRoom ? (
          isListView ? (
            <TableListView />
          ) : (
            <SimpleTableLayout
              tables={roomTables.map(table => ({
                id: table.id,
                name: table.name,
                x: (table as any).x || 0,
                y: (table as any).y || 0,
                width: 140,
                height: 140,
                room_id: table.room_id,
                capacity: table.capacity
              }))}
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
              onUpdateTable={(updatedTable) => {
                updateTable.mutateAsync({
                  id: updatedTable.id,
                  name: updatedTable.name,
                  capacity: updatedTable.capacity,
                  x: updatedTable.x,
                  y: updatedTable.y
                }).catch(error => {
                  console.error('Failed to update table:', error)
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
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header with controls */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              ← Tilbage til Hovedmenu
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Bordoversigt
              </h1>
              <p className="text-muted-foreground">Administrer borde og layout</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Gem Layout' : 'Rediger Layout'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBulkCreate(!showBulkCreate)}
            >
              Opret Borde
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsListView(!isListView)}
            >
              {isListView ? 'Layout Visning' : 'Liste Visning'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {content}
      </div>
    </div>
  )
}
