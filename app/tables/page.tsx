'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCreateRoom, useCreateTable, useUpdateTable, useDeleteRoom, useDeleteTable } from '@/hooks/useTableManagement'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import SimpleTableLayout from '@/components/SimpleTableLayout'
import AppLayout from '@/components/AppLayout'

export default function TablesPage() {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isListView, setIsListView] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: rooms } = useRooms()
  const { data: tables } = useTables()
  
  // Table management hooks
  const createTable = useCreateTable()
  const updateTable = useUpdateTable()
  const deleteTable = useDeleteTable()

  // Auto-select first room if none selected
  const effectiveRoomId = selectedRoomId || rooms?.[0]?.id || null
  const selectedRoom = rooms?.find(room => room.id === effectiveRoomId)
  
  // Filter tables for selected room and search term
  const roomTables = tables?.filter(table => {
    const matchesRoom = table.room_id === effectiveRoomId
    const matchesSearch = searchTerm.trim() === '' || 
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRoom && matchesSearch
  }) || []

  // If searching, also include tables from other rooms that match
  const searchResults = searchTerm.trim() !== '' 
    ? tables?.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.id.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : []

  // Use search results if searching, otherwise use room tables
  const displayTables = searchTerm.trim() !== '' ? searchResults : roomTables

  const TableListView = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Søg efter bord navn eller nummer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-12 text-lg"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm.trim() !== '' && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            Viser {displayTables.length} bord{displayTables.length !== 1 ? 'e' : ''} der matcher "{searchTerm}"
          </p>
          {displayTables.length > roomTables.length && (
            <Badge variant="secondary" className="text-xs">
              Inkluderer borde fra andre lokaler
            </Badge>
          )}
        </div>
      )}

      {/* Tables List */}
      {displayTables.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm.trim() !== '' ? 'Ingen borde fundet' : 'Ingen borde i dette lokale'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm.trim() !== '' 
              ? `Ingen borde matcher "${searchTerm}"`
              : 'Opret borde i redigeringstilstand'
            }
          </p>
        </div>
      ) : (
        displayTables.map(table => {
          const tableRoom = rooms?.find(room => room.id === table.room_id)
          return (
            <Card key={table.id} className="cursor-pointer hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-primary">{table.name}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{table.name}</h3>
                        {searchTerm.trim() !== '' && tableRoom && table.room_id !== effectiveRoomId && (
                          <Badge variant="outline" className="text-xs">
                            {tableRoom.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Kapacitet: {table.capacity} personer
                        {tableRoom && searchTerm.trim() !== '' && ` • ${tableRoom.name}`}
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
          )
        })
      )}
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
  )
}
