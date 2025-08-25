'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRooms, useTables } from '@/hooks/useRoomsTables'
import { useCreateRoom, useCreateTable, useUpdateTable, useDeleteRoom, useDeleteTable } from '@/hooks/useTableManagement'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SimpleTableLayout from '@/components/SimpleTableLayout'

export default function TablesPage() {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  
  const { data: rooms } = useRooms()
  const { data: tables } = useTables()
  
  // Table management hooks
  const createTable = useCreateTable()
  const updateTable = useUpdateTable()
  const deleteTable = useDeleteTable()

  // Auto-select first room if none selected
  const effectiveRoomId = selectedRoomId || rooms?.[0]?.id || null
  const selectedRoom = rooms?.find(room => room.id === effectiveRoomId)



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbage til Menu
              </Button>
            </Link>
            
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
                    <SelectItem value="none">Vælg lokale</SelectItem>
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

          {selectedRoom && (
            <div className="text-sm text-muted-foreground">
              Klik på borde for at oprette ordrer
            </div>
          )}
        </div>
      </div>

      {/* 2D Layout */}
      <div className="p-6 max-w-7xl mx-auto">
        {selectedRoom ? (
          <SimpleTableLayout
            tables={tables?.filter(table => table.room_id === effectiveRoomId).map(table => ({
              id: table.id,
              name: table.name,
              x: (table as any).x || 0,
              y: (table as any).y || 0,
              width: 60,
              height: 60,
              room_id: table.room_id,
              capacity: table.capacity
            })) || []}
            rooms={[{
              id: selectedRoom.id,
              name: selectedRoom.name,
              color: selectedRoom.color || '#3B82F6'
            }]}
            selectedRoomId={effectiveRoomId}
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
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Ingen lokaler fundet</h3>
            <p className="text-muted-foreground">Opret lokaler i Admin panelet for at komme i gang</p>
          </div>
        )}
      </div>
    </div>
  )
}
