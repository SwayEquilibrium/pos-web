/**
 * Reservations Hook v1.0
 *
 * Provides React hooks for managing restaurant reservations
 * Feature flag: reservationsV1
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

// ================================================
// TYPES
// ================================================

export interface Reservation {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  party_size: number
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  notes?: string
  table_id?: string
  table_name?: string
  created_at: string
  updated_at: string
}

export interface CreateReservationData {
  customer_name: string
  customer_email?: string
  customer_phone?: string
  party_size: number
  date: string
  time: string
  notes?: string
  table_id?: string
}

// ================================================
// QUERY KEYS
// ================================================

const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...reservationKeys.lists(), filters] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
}

// ================================================
// HOOKS
// ================================================

/**
 * Hook to fetch reservations with optional filters
 */
export function useReservations(filters?: {
  date?: string
  status?: Reservation['status']
  table_id?: string
  limit?: number
}) {
  return useQuery({
    queryKey: reservationKeys.list(filters || {}),
    queryFn: () => fetchReservations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch a single reservation by ID
 */
export function useReservation(id: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id),
    queryFn: () => fetchReservation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new reservation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReservation,
    onSuccess: (reservation) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })

      // If date is specified, also invalidate that specific date's reservations
      if (reservation.date) {
        queryClient.invalidateQueries({
          queryKey: reservationKeys.list({ date: reservation.date })
        })
      }
    },
  })
}

/**
 * Hook to update an existing reservation
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reservation> }) =>
      updateReservation(id, updates),
    onSuccess: (reservation, { id }) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })

      // If date changed, invalidate both old and new dates
      if (reservation.date) {
        queryClient.invalidateQueries({
          queryKey: reservationKeys.list({ date: reservation.date })
        })
      }
    },
  })
}

/**
 * Hook to delete a reservation
 */
export function useDeleteReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReservation,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      queryClient.removeQueries({ queryKey: reservationKeys.detail(id) })
    },
  })
}

// ================================================
// API FUNCTIONS (Mock implementations for now)
// ================================================

async function fetchReservations(filters?: {
  date?: string
  status?: Reservation['status']
  table_id?: string
  limit?: number
}): Promise<Reservation[]> {
  // Mock data for development
  const mockReservations: Reservation[] = [
    {
      id: '1',
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      customer_phone: '+45 12 34 56 78',
      party_size: 4,
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      status: 'confirmed',
      notes: 'Birthday celebration',
      table_id: 'table-1',
      table_name: 'Table 1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      customer_name: 'Jane Doe',
      customer_email: 'jane@example.com',
      party_size: 2,
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      status: 'confirmed',
      notes: 'Romantic dinner',
      table_id: 'table-2',
      table_name: 'Table 2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  // Apply filters
  let filtered = mockReservations

  if (filters?.date) {
    filtered = filtered.filter(r => r.date === filters.date)
  }

  if (filters?.status) {
    filtered = filtered.filter(r => r.status === filters.status)
  }

  if (filters?.table_id) {
    filtered = filtered.filter(r => r.table_id === filters.table_id)
  }

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  return filtered
}

async function fetchReservation(id: string): Promise<Reservation | null> {
  const reservations = await fetchReservations()
  return reservations.find(r => r.id === id) || null
}

async function createReservation(data: CreateReservationData): Promise<Reservation> {
  // Mock implementation
  const newReservation: Reservation = {
    id: Date.now().toString(),
    ...data,
    status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return newReservation
}

async function updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation> {
  // Mock implementation
  const existing = await fetchReservation(id)
  if (!existing) {
    throw new Error('Reservation not found')
  }

  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  return updated
}

async function deleteReservation(id: string): Promise<void> {
  // Mock implementation - in real app would delete from database
  console.log(`Deleting reservation ${id}`)
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Hook to get today's reservations
 */
export function useTodayReservations() {
  const today = new Date().toISOString().split('T')[0]
  return useReservations({ date: today, status: 'confirmed' })
}

/**
 * Hook to get upcoming reservations
 */
export function useUpcomingReservations(limit = 10) {
  const today = new Date().toISOString().split('T')[0]
  return useReservations({
    date: today,
    status: 'confirmed',
    limit
  })
}

/**
 * Hook to manage reservation stats
 */
export function useReservationStats() {
  const { data: reservations = [] } = useReservations()

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'pending').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    totalGuests: reservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.party_size, 0),
  }

  return stats
}

