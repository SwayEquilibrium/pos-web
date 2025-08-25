'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface CreateRoomParams {
  name: string
  sort_index?: number
}

export interface CreateTableParams {
  name: string
  room_id: string
  capacity?: number
  sort_index?: number
  x?: number
  y?: number
}

export interface UpdateRoomParams {
  id: string
  name?: string
  sort_index?: number
}

export interface UpdateTableParams {
  id: string
  name?: string
  room_id?: string
  status?: 'idle' | 'occupied' | 'reserved' | 'cleaning'
  capacity?: number
  sort_index?: number
  x?: number
  y?: number
}

// Create new room
export function useCreateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateRoomParams) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: params.name,
          sort_index: params.sort_index || 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating room:', error)
        throw new Error(`Failed to create room: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch rooms data
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    }
  })
}

// Update existing room
export function useUpdateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: UpdateRoomParams) => {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          name: params.name,
          sort_index: params.sort_index
        })
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating room:', error)
        throw new Error(`Failed to update room: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch rooms data
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    }
  })
}

// Create new table
export function useCreateTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreateTableParams) => {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          name: params.name,
          room_id: params.room_id,
          status: 'idle',
          sort_index: params.sort_index || 0,
          capacity: params.capacity || 4,
          x: params.x || 0,
          y: params.y || 0
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating table:', error)
        throw new Error(`Failed to create table: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch tables data
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

// Update table
export function useUpdateTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: UpdateTableParams) => {
      const { id, ...updateData } = params
      
      const { data, error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating table:', error)
        throw new Error(`Failed to update table: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch tables data
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

// Delete room
export function useDeleteRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
      
      if (error) {
        console.error('Error deleting room:', error)
        throw new Error(`Failed to delete room: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch rooms and tables data
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

// Delete table
export function useDeleteTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (tableId: string) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)
      
      if (error) {
        console.error('Error deleting table:', error)
        throw new Error(`Failed to delete table: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tables data
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}
