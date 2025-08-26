'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MapPin, Users, Settings, Clock } from 'lucide-react'
import { flags } from '@/src/config/flags'

// Import hooks only when flag is enabled
let useUpdateTableBookingStatus: any = null
let useTableAvailability: any = null

if (flags.reservationsV1) {
  try {
    const hooks = require('@/proposals/hooks/useReservations.v1')
    useUpdateTableBookingStatus = hooks.useUpdateTableBookingStatus
  } catch (error) {
    console.warn('Could not load reservation hooks:', error)
  }
}

interface Table {
  id: string
  name: string
  capacity: number
  location: string
  available_for_booking: boolean
  booking_buffer_minutes: number
  current_status: 'available' | 'occupied' | 'reserved'
  todays_reservations: number
}

interface TableBookingSettingsProps {
  tables?: Table[]
}

export default function TableBookingSettings({ tables = [] }: TableBookingSettingsProps) {
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [bufferMinutes, setBufferMinutes] = useState<Record<string, number>>({})
  
  const updateTableStatus = flags.reservationsV1 
    ? useUpdateTableBookingStatus()
    : { mutateAsync: async () => alert('Table booking status updated (mock)') }

  // Mock data when tables not provided
  const mockTables: Table[] = [
    {
      id: 'table-1',
      name: 'Bord 1',
      capacity: 4,
      location: 'Main Hall',
      available_for_booking: true,
      booking_buffer_minutes: 15,
      current_status: 'available',
      todays_reservations: 2
    },
    {
      id: 'table-2',
      name: 'Bord 2',
      capacity: 2,
      location: 'Window Section',
      available_for_booking: true,
      booking_buffer_minutes: 15,
      current_status: 'reserved',
      todays_reservations: 1
    },
    {
      id: 'table-3',
      name: 'Bord 3',
      capacity: 6,
      location: 'Private Room',
      available_for_booking: false,
      booking_buffer_minutes: 30,
      current_status: 'available',
      todays_reservations: 0
    }
  ]
  
  const displayTables = tables.length > 0 ? tables : mockTables

  const handleBookingToggle = async (tableId: string, enabled: boolean) => {
    try {
      await updateTableStatus.mutateAsync({
        table_id: tableId,
        available_for_booking: enabled
      })
    } catch (error) {
      console.error('Failed to update table booking status:', error)
      alert('Fejl ved opdatering af bordstatus')
    }
  }

  const handleBufferUpdate = async (tableId: string) => {
    const minutes = bufferMinutes[tableId]
    if (!minutes || minutes < 0 || minutes > 120) {
      alert('Buffer tid skal være mellem 0 og 120 minutter')
      return
    }

    try {
      await updateTableStatus.mutateAsync({
        table_id: tableId,
        available_for_booking: true, // Keep current status
        booking_buffer_minutes: minutes
      })
      setEditingTable(null)
      setBufferMinutes({})
    } catch (error) {
      console.error('Failed to update buffer time:', error)
      alert('Fejl ved opdatering af buffer tid')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Ledig'
      case 'occupied': return 'Optaget'
      case 'reserved': return 'Reserveret'
      default: return 'Ukendt'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bordindstillinger</h2>
          <p className="text-muted-foreground">
            Administrer hvilke borde der kan bookes online
            {!flags.reservationsV1 && (
              <span className="ml-2 text-orange-600 font-medium">
                (Demo mode - enable reservationsV1 flag)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {displayTables.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Borde</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {displayTables.filter(t => t.available_for_booking).length}
            </div>
            <div className="text-sm text-muted-foreground">Bookbare</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {displayTables.filter(t => t.current_status === 'reserved').length}
            </div>
            <div className="text-sm text-muted-foreground">Reserveret</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {displayTables.reduce((sum, t) => sum + t.todays_reservations, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Dagens Reservationer</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables List */}
      <div className="space-y-4">
        {displayTables.map((table) => (
          <Card key={table.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{table.name}</h3>
                    <Badge className={getStatusColor(table.current_status)}>
                      {getStatusText(table.current_status)}
                    </Badge>
                    {table.available_for_booking && (
                      <Badge variant="secondary">Bookbar</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {table.capacity} pladser
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {table.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {table.booking_buffer_minutes} min buffer
                    </div>
                    <div>
                      {table.todays_reservations} reservationer i dag
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Booking Buffer Settings */}
                  {editingTable === table.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="120"
                        value={bufferMinutes[table.id] || table.booking_buffer_minutes}
                        onChange={(e) => setBufferMinutes({
                          ...bufferMinutes,
                          [table.id]: parseInt(e.target.value)
                        })}
                        className="w-20"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleBufferUpdate(table.id)}
                      >
                        Gem
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTable(null)
                          setBufferMinutes({})
                        }}
                      >
                        Annuller
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTable(table.id)
                        setBufferMinutes({
                          ...bufferMinutes,
                          [table.id]: table.booking_buffer_minutes
                        })
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Online Booking Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`booking-${table.id}`}
                      checked={table.available_for_booking}
                      onCheckedChange={(checked) => handleBookingToggle(table.id, checked)}
                    />
                    <Label htmlFor={`booking-${table.id}`} className="text-sm">
                      Online booking
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
