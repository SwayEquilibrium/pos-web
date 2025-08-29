// Reservations Hook v1.0
// React Query hooks for reservation management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface Reservation {
  id: string
  tenant_id: string
  location_id?: string
  reservation_number: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  party_size: number
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  special_requests?: string
  assigned_tables?: Array<{
    table_id: string
    assigned_at: string
  }>
  created_at: string
  updated_at: string
}

export interface CreateReservationParams {
  customer_name: string
  customer_phone?: string
  customer_email?: string
  party_size: number
  reservation_date: string
  reservation_time: string
  duration_minutes?: number
  special_requests?: string
  table_ids?: string[]
  location_id?: string
}

export interface TableAvailability {
  table_id: string
  table_name: string
  capacity: number
  location: string
  available_for_booking: boolean
  current_status: 'available' | 'occupied' | 'reserved'
}

// Get all reservations
export function useReservations(filters?: {
  date?: string
  status?: string
  customer_phone?: string
}) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: async () => {
      let query = supabase
        .from('reservation_details')
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })
      
      if (filters?.date) {
        query = query.eq('reservation_date', filters.date)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.customer_phone) {
        query = query.ilike('customer_phone', `%${filters.customer_phone}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as Reservation[]
    }
  })
}

// Get single reservation
export function useReservation(reservationId: string) {
  return useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservation_details')
        .select('*')
        .eq('id', reservationId)
        .single()
      
      if (error) throw error
      return data as Reservation
    },
    enabled: !!reservationId
  })
}

// Create reservation
export function useCreateReservation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateReservationParams) => {
      const { data, error } = await supabase.rpc('create_reservation', {
        p_tenant_id: 'current-tenant', // Would get from auth context
        p_customer_name: params.customer_name,
        p_customer_phone: params.customer_phone,
        p_customer_email: params.customer_email,
        p_party_size: params.party_size,
        p_reservation_date: params.reservation_date,
        p_reservation_time: params.reservation_time,
        p_duration_minutes: params.duration_minutes || 120,
        p_special_requests: params.special_requests,
        p_table_ids: params.table_ids,
        p_location_id: params.location_id
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['table-availability'] })
    }
  })
}

// Update reservation status
export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      reservationId: string
      status: Reservation['status']
      notes?: string
    }) => {
      const { error } = await supabase.rpc('update_reservation_status', {
        p_reservation_id: params.reservationId,
        p_status: params.status,
        p_notes: params.notes
      })
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservation', variables.reservationId] })
      queryClient.invalidateQueries({ queryKey: ['table-availability'] })
    }
  })
}

// Get table availability for a time slot
export function useTableAvailability(params: {
  date: string
  time: string
  duration?: number
  party_size: number
}) {
  return useQuery({
    queryKey: ['table-availability', params],
    queryFn: async () => {
      const startTime = `${params.date} ${params.time}`
      const endTime = new Date(new Date(startTime).getTime() + (params.duration || 120) * 60000)
        .toISOString()
      
      const { data, error } = await supabase.rpc('find_available_tables', {
        p_tenant_id: 'current-tenant',
        p_start_time: startTime,
        p_end_time: endTime.slice(0, 19), // Remove Z suffix
        p_party_size: params.party_size
      })
      
      if (error) throw error
      return data as TableAvailability[]
    },
    enabled: !!(params.date && params.time && params.party_size > 0)
  })
}

// Update table booking availability
export function useUpdateTableBookingStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      table_id: string
      available_for_booking: boolean
    }) => {
      const { error } = await supabase
        .from('tables')
        .update({ available_for_booking: params.available_for_booking })
        .eq('id', params.table_id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-availability'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}




