'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, Phone, Mail, MapPin, Settings, Plus } from 'lucide-react'
import { flags } from '@/src/config/flags'

// Import v1 hooks only when flag is enabled
let useReservations: any = null
let useCreateReservation: any = null
let useUpdateReservationStatus: any = null
let useTableAvailability: any = null

if (flags.reservationsV1) {
  const hooks = require('@/proposals/hooks/useReservations.v1')
  useReservations = hooks.useReservations
  useCreateReservation = hooks.useCreateReservation
  useUpdateReservationStatus = hooks.useUpdateReservationStatus
  useTableAvailability = hooks.useTableAvailability
}

export default function BookingManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Mock data for when flag is disabled
  const mockReservations = [
    {
      id: '1',
      reservation_number: 'RES-20241201-0001',
      customer_name: 'Lars Hansen',
      customer_phone: '+45 12 34 56 78',
      party_size: 4,
      reservation_date: selectedDate,
      reservation_time: '18:00',
      status: 'confirmed',
      assigned_tables: [{ table_id: 'table-1', table_name: 'Bord 1' }]
    },
    {
      id: '2',
      reservation_number: 'RES-20241201-0002',
      customer_name: 'Maria Nielsen',
      customer_phone: '+45 98 76 54 32',
      party_size: 2,
      reservation_date: selectedDate,
      reservation_time: '19:30',
      status: 'confirmed',
      assigned_tables: [{ table_id: 'table-3', table_name: 'Bord 3' }]
    }
  ]
  
  // Use v1 hooks if flag is enabled, otherwise use mock data
  const { data: reservations = mockReservations, isLoading } = flags.reservationsV1 
    ? useReservations({ date: selectedDate })
    : { data: mockReservations, isLoading: false }
  
  const createReservation = flags.reservationsV1 
    ? useCreateReservation()
    : { mutateAsync: async () => alert('Reservation created (mock)') }
  
  const updateStatus = flags.reservationsV1
    ? useUpdateReservationStatus()
    : { mutateAsync: async () => alert('Status updated (mock)') }

  const [newReservation, setNewReservation] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    reservation_date: selectedDate,
    reservation_time: '18:00',
    duration_minutes: 120,
    special_requests: ''
  })

  const handleCreateReservation = async () => {
    try {
      await createReservation.mutateAsync(newReservation)
      setShowCreateForm(false)
      setNewReservation({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        reservation_date: selectedDate,
        reservation_time: '18:00',
        duration_minutes: 120,
        special_requests: ''
      })
    } catch (error) {
      console.error('Failed to create reservation:', error)
      alert('Fejl ved oprettelse af reservation')
    }
  }

  const handleStatusChange = async (reservationId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ reservationId, status })
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Fejl ved opdatering af status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'seated': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-orange-100 text-orange-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bekræftet'
      case 'seated': return 'Ankommet'
      case 'completed': return 'Afsluttet'
      case 'cancelled': return 'Aflyst'
      case 'no_show': return 'Udeblev'
      default: return 'Afventer'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bordreservationer</h1>
          <p className="text-muted-foreground">
            Administrer bordreservationer og online bookinger
            {!flags.reservationsV1 && (
              <span className="ml-2 text-orange-600 font-medium">
                (Demo mode - enable reservationsV1 flag)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin/operations/tables'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Bordindstillinger
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ny Reservation
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="date-filter">Dato:</Label>
            <Input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <div className="text-sm text-muted-foreground">
              {reservations.length} reservationer
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Reservation Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ny Reservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Kundens navn *</Label>
                <Input
                  id="customer-name"
                  value={newReservation.customer_name}
                  onChange={(e) => setNewReservation({...newReservation, customer_name: e.target.value})}
                  placeholder="Indtast kundens navn"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Telefonnummer</Label>
                <Input
                  id="customer-phone"
                  value={newReservation.customer_phone}
                  onChange={(e) => setNewReservation({...newReservation, customer_phone: e.target.value})}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={newReservation.customer_email}
                  onChange={(e) => setNewReservation({...newReservation, customer_email: e.target.value})}
                  placeholder="kunde@email.dk"
                />
              </div>
              <div>
                <Label htmlFor="party-size">Antal personer *</Label>
                <Input
                  id="party-size"
                  type="number"
                  min="1"
                  max="20"
                  value={newReservation.party_size}
                  onChange={(e) => setNewReservation({...newReservation, party_size: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="reservation-date">Dato *</Label>
                <Input
                  id="reservation-date"
                  type="date"
                  value={newReservation.reservation_date}
                  onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="reservation-time">Tidspunkt *</Label>
                <Input
                  id="reservation-time"
                  type="time"
                  value={newReservation.reservation_time}
                  onChange={(e) => setNewReservation({...newReservation, reservation_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="special-requests">Særlige ønsker</Label>
              <Input
                id="special-requests"
                value={newReservation.special_requests}
                onChange={(e) => setNewReservation({...newReservation, special_requests: e.target.value})}
                placeholder="Allergier, fødselsdag, etc."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateReservation} disabled={!newReservation.customer_name}>
                Opret Reservation
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Ingen reservationer</h3>
              <p className="text-muted-foreground">
                Der er ingen reservationer for {selectedDate}
              </p>
            </CardContent>
          </Card>
        ) : (
          reservations.map((reservation: any) => (
            <Card key={reservation.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{reservation.customer_name}</h3>
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        #{reservation.reservation_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {reservation.reservation_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {reservation.party_size} personer
                      </div>
                      {reservation.customer_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {reservation.customer_phone}
                        </div>
                      )}
                      {reservation.assigned_tables?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {reservation.assigned_tables.map((t: any) => t.table_name || `Bord ${t.table_id}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {reservation.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'seated')}
                      >
                        Ankommet
                      </Button>
                    )}
                    {reservation.status === 'seated' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                      >
                        Afslut
                      </Button>
                    )}
                    {['confirmed', 'seated'].includes(reservation.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                      >
                        Aflys
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
