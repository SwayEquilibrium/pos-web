'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCreateRoom, useCreateTable, useUpdateTable, useDeleteRoom, useDeleteTable } from '@/hooks/useTableManagement'
import { SimpleBackButton } from '@/components/BackNavigation'
import SimpleTableLayout from '@/components/SimpleTableLayout'

type ActiveTab = 'rooms' | 'tables' | 'layout'

interface Room {
  id: string
  name: string
  sort_index: number
}

interface Table {
  id: string
  name: string
  room_id: string
  status: 'idle' | 'occupied' | 'reserved' | 'cleaning'
  sort_index: number
  capacity?: number
}

export default function TableManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('rooms')
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showCreateTable, setShowCreateTable] = useState(false)

  const { data: rooms } = useRooms()
  const { data: tables } = useTables()
  
  // Mutations
  const createRoom = useCreateRoom()
  const createTable = useCreateTable()
  const updateTable = useUpdateTable()
  const deleteRoom = useDeleteRoom()
  const deleteTable = useDeleteTable()

  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    sort_index: 0
  })

  const [tableForm, setTableForm] = useState({
    name: '',
    room_id: '',
    capacity: 4,
    sort_index: 0
  })

  const handleCreateRoom = async () => {
    if (!roomForm.name.trim()) {
      alert('Lokale navn er påkrævet')
      return
    }

    try {
      await createRoom.mutateAsync({
        name: roomForm.name,
        sort_index: roomForm.sort_index
      })
      
      alert('Lokale oprettet! ✅')
      setShowCreateRoom(false)
      setRoomForm({ name: '', description: '', sort_index: 0 })
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Fejl ved oprettelse af lokale: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleCreateTable = async () => {
    if (!tableForm.name.trim() || !tableForm.room_id) {
      alert('Bordnavn og lokale er påkrævet')
      return
    }

    try {
      await createTable.mutateAsync({
        name: tableForm.name,
        room_id: tableForm.room_id,
        sort_index: tableForm.sort_index
      })
      
      alert('Bord oprettet! ✅')
      setShowCreateTable(false)
      setTableForm({ name: '', room_id: '', capacity: 4, sort_index: 0 })
    } catch (error) {
      console.error('Error creating table:', error)
      alert('Fejl ved oprettelse af bord: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'idle': return 'secondary'
      case 'occupied': return 'default'
      case 'reserved': return 'outline'
      case 'cleaning': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'idle': return 'Ledig'
      case 'occupied': return 'Optaget'
      case 'reserved': return 'Reserveret'
      case 'cleaning': return 'Rengøring'
      default: return status
    }
  }

  const getRoomTables = (roomId: string) => {
    return tables?.filter(table => table.room_id === roomId) || []
  }

  const getTableStats = () => {
    const totalTables = tables?.length || 0
    const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0
    const availableTables = tables?.filter(t => t.status === 'idle').length || 0
    
    return { totalTables, occupiedTables, availableTables }
  }

  const stats = getTableStats()

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Borde & Lokaler</h1>
          <p className="text-muted-foreground">Administrer lokaler og bordopsætning</p>
        </div>
        {activeTab !== 'layout' && (
          <Button 
            onClick={() => {
              if (activeTab === 'rooms') {
                setShowCreateRoom(true)
              } else {
                // Pre-fill room if one is selected
                if (selectedRoom) {
                  setTableForm(prev => ({ ...prev, room_id: selectedRoom }))
                }
                setShowCreateTable(true)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {activeTab === 'rooms' ? '🏠 Opret Lokale' : '🪑 Opret Bord'}
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{rooms?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Lokaler</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalTables}</div>
            <p className="text-sm text-muted-foreground">Total Borde</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.availableTables}</div>
            <p className="text-sm text-muted-foreground">Ledige Borde</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.occupiedTables}</div>
            <p className="text-sm text-muted-foreground">Optagne Borde</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'rooms' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rooms')}
        >
          🏠 Lokaler
        </Button>
        <Button
          variant={activeTab === 'tables' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tables')}
        >
          🪑 Borde
        </Button>
        <Button
          variant={activeTab === 'layout' ? 'default' : 'outline'}
          onClick={() => setActiveTab('layout')}
        >
          🎨 Layout Designer
        </Button>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Create Room Form */}
          {showCreateRoom && (
            <Card>
              <CardHeader>
                <CardTitle>Opret Nyt Lokale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Navn *</Label>
                    <Input
                      id="roomName"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Lokale navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomSortIndex">Sortering</Label>
                    <Input
                      id="roomSortIndex"
                      type="number"
                      value={roomForm.sort_index}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, sort_index: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomDescription">Beskrivelse</Label>
                  <Input
                    id="roomDescription"
                    value={roomForm.description}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateRoom}
                    disabled={createRoom.isPending}
                  >
                    {createRoom.isPending ? '⏳ Opretter...' : 'Gem Lokale'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateRoom(false)}>Annuller</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rooms List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms?.map(room => {
              const roomTables = getRoomTables(room.id)
              const occupiedCount = roomTables.filter(t => t.status === 'occupied').length
              
              return (
                <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{room.name}</h3>
                      <Badge variant="outline">
                        {roomTables.length} borde
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Optagne:</span>
                        <span className="font-medium">{occupiedCount}/{roomTables.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${roomTables.length > 0 ? (occupiedCount / roomTables.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedRoom(room.id)
                          setActiveTab('tables')
                        }}
                      >
                        Se Borde
                      </Button>
                      <Button size="sm" variant="outline">Rediger</Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          const roomTables = tables?.filter(table => table.room_id === room.id) || []
                          
                          if (roomTables.length > 0) {
                            alert(`Kan ikke slette lokalet "${room.name}" fordi det indeholder ${roomTables.length} bord(e). Slet bordene først.`)
                            return
                          }
                          
                          if (confirm(`Er du sikker på at du vil slette lokalet "${room.name}"?`)) {
                            try {
                              await deleteRoom.mutateAsync(room.id)
                              alert('Lokale slettet! ✅')
                            } catch (error) {
                              console.error('Error deleting room:', error)
                              alert('Fejl ved sletning af lokale: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
                            }
                          }
                        }}
                        disabled={deleteRoom.isPending}
                      >
                        {deleteRoom.isPending ? '⏳ Sletter...' : 'Slet'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tables Tab */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Room Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label>Filter efter lokale:</Label>
                <Select value={selectedRoom || 'all'} onValueChange={(value) => setSelectedRoom(value === 'all' ? null : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Alle lokaler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle lokaler</SelectItem>
                    {rooms?.map(room => (
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
                {selectedRoom && (
                  <Badge variant="secondary">
                    {rooms?.find(r => r.id === selectedRoom)?.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* No Rooms Warning */}
          {(!rooms || rooms.length === 0) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <span>⚠️</span>
                  <span className="font-medium">Ingen lokaler fundet</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Du skal først oprette et lokale før du kan tilføje borde.
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setActiveTab('rooms')
                    setShowCreateRoom(true)
                  }}
                >
                  Opret Lokale Nu
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Table Form */}
          {showCreateTable && rooms && rooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Opret Nyt Bord</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tableName">Bordnavn *</Label>
                    <Input
                      id="tableName"
                      value={tableForm.name}
                      onChange={(e) => setTableForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Bord 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableRoom">Lokale *</Label>
                    <Select value={tableForm.room_id} onValueChange={(value) => setTableForm(prev => ({ ...prev, room_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg lokale" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map(room => (
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
                  <div className="space-y-2">
                    <Label htmlFor="tableCapacity">Kapacitet (personer)</Label>
                    <Input
                      id="tableCapacity"
                      type="number"
                      min="1"
                      max="20"
                      value={tableForm.capacity}
                      onChange={(e) => setTableForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableSortIndex">Sortering</Label>
                    <Input
                      id="tableSortIndex"
                      type="number"
                      value={tableForm.sort_index}
                      onChange={(e) => setTableForm(prev => ({ ...prev, sort_index: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateTable}
                    disabled={createTable.isPending}
                  >
                    {createTable.isPending ? '⏳ Opretter...' : 'Gem Bord'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateTable(false)}>Annuller</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tables List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables
              ?.filter(table => !selectedRoom || table.room_id === selectedRoom)
              .map(table => {
                const room = rooms?.find(r => r.id === table.room_id)
                
                return (
                  <Card key={table.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{table.name}</h3>
                        <Badge variant={getStatusBadgeVariant(table.status)}>
                          {getStatusDisplayName(table.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>📍 {room?.name}</p>
                        <p>👥 {table.capacity || 4} personer</p>
                        <p>📊 Status: {getStatusDisplayName(table.status)}</p>
                      </div>
                      <div className="flex gap-1 mt-4">
                        <Button size="sm" variant="outline">Rediger</Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={table.status === 'occupied' ? 'text-red-600' : 'text-green-600'}
                        >
                          {table.status === 'occupied' ? 'Frigør' : 'Optag'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (table.status === 'occupied') {
                              alert(`Kan ikke slette bordet "${table.name}" fordi det er optaget. Frigør bordet først.`)
                              return
                            }
                            
                            if (confirm(`Er du sikker på at du vil slette bordet "${table.name}"?`)) {
                              try {
                                await deleteTable.mutateAsync(table.id)
                                alert('Bord slettet! ✅')
                              } catch (error) {
                                console.error('Error deleting table:', error)
                                alert('Fejl ved sletning af bord: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
                              }
                            }
                          }}
                          disabled={deleteTable.isPending}
                        >
                          {deleteTable.isPending ? '⏳' : '🗑️'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>

          {(!tables || tables.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {selectedRoom 
                    ? 'Ingen borde i dette lokale'
                    : 'Ingen borde fundet'
                  }
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowCreateTable(true)}
                >
                  Opret første bord
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Layout Designer Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-4">
          {/* Room Selection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label className="font-medium">
                  Vælg Lokale:
                </Label>
                <Select value={selectedRoom || 'none'} onValueChange={(value) => setSelectedRoom(value === 'none' ? null : value)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Vælg et lokale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Vælg et lokale</SelectItem>
                    {rooms?.map(room => (
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
                {selectedRoom && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: rooms?.find(r => r.id === selectedRoom)?.color || '#3B82F6' }}
                    ></div>
                    {rooms?.find(r => r.id === selectedRoom)?.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Layout Designer */}
          {selectedRoom && (
            <SimpleTableLayout
              tables={tables?.map(table => ({
                id: table.id,
                name: table.name,
                x: (table as any).x || 0,
                y: (table as any).y || 0,
                width: 60,
                height: 60,
                room_id: table.room_id,
                capacity: table.capacity
              })) || []}
              rooms={rooms?.map(room => ({
                id: room.id,
                name: room.name,
                color: room.color || '#3B82F6'
              })) || []}
              selectedRoomId={selectedRoom}
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
          )}

          {/* No Room Selected */}
          {!selectedRoom && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Vælg et lokale</h3>
                <p className="text-muted-foreground">
                  Vælg et lokale ovenfor for at designe layoutet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
