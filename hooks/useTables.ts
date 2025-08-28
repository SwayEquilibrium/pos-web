import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as tablesRepo from '@/lib/repos/tables.repo'

// ================================================
// TABLES HOOK - TABLE MANAGEMENT
// ================================================

// Query keys
const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (filters: string) => [...tableKeys.lists(), { filters }] as const,
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (id: string) => [...tableKeys.details(), id] as const,
  room: (roomId: string) => [...tableKeys.all, 'room', roomId] as const,
  rooms: () => [...tableKeys.all, 'rooms'] as const,
  layout: (roomId?: string) => [...tableKeys.all, 'layout', roomId] as const,
}

// ================================================
// TABLES
// ================================================

export function useTables() {
  return useQuery({
    queryKey: tableKeys.list('all'),
    queryFn: tablesRepo.getTables,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useTable(tableId: string) {
  return useQuery({
    queryKey: tableKeys.detail(tableId),
    queryFn: () => tablesRepo.getTable(tableId),
    enabled: !!tableId,
    staleTime: 30 * 1000,
  })
}

export function useRoomTables(roomId: string) {
  return useQuery({
    queryKey: tableKeys.room(roomId),
    queryFn: () => tablesRepo.getRoomTables(roomId),
    enabled: !!roomId,
    staleTime: 30 * 1000,
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tablesRepo.createTable,
    onSuccess: (table) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      if (table.room_id) {
        queryClient.invalidateQueries({ queryKey: tableKeys.room(table.room_id) })
      }
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useUpdateTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<tablesRepo.Table> }) =>
      tablesRepo.updateTable(id, updates),
    onSuccess: (table, { id }) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      if (table.room_id) {
        queryClient.invalidateQueries({ queryKey: tableKeys.room(table.room_id) })
      }
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tablesRepo.deleteTable,
    onSuccess: (_, tableId) => {
      // Get the table to find its room_id for invalidation
      const table = queryClient.getQueryData(tableKeys.detail(tableId)) as tablesRepo.Table
      if (table?.room_id) {
        queryClient.invalidateQueries({ queryKey: tableKeys.room(table.room_id) })
      }
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
      queryClient.removeQueries({ queryKey: tableKeys.detail(tableId) })
    },
  })
}

// ================================================
// ROOMS
// ================================================

export function useRooms() {
  return useQuery({
    queryKey: tableKeys.rooms(),
    queryFn: tablesRepo.getRooms,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: tableKeys.detail(roomId),
    queryFn: () => tablesRepo.getRoom(roomId),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tablesRepo.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<tablesRepo.Room> }) =>
      tablesRepo.updateRoom(id, updates),
    onSuccess: (room, { id }) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: tableKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tablesRepo.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

// ================================================
// TABLE LAYOUT
// ================================================

export function useTableLayout(roomId?: string) {
  return useQuery({
    queryKey: tableKeys.layout(roomId),
    queryFn: () => tablesRepo.getTableLayout(roomId),
    staleTime: 30 * 1000,
  })
}

export function useUpdateTablePosition() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ tableId, x, y }: { tableId: string; x: number; y: number }) =>
      tablesRepo.updateTablePosition(tableId, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useUpdateTableSize() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ tableId, width, height }: { tableId: string; width: number; height: number }) =>
      tablesRepo.updateTableSize(tableId, width, height),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useMoveTable() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ tableId, roomId, x, y }: { 
      tableId: string
      roomId: string
      x: number
      y: number
    }) => tablesRepo.moveTable(tableId, roomId, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

// ================================================
// REORDERING
// ================================================

export function useReorderTables() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ roomId, tableIds }: { roomId: string; tableIds: string[] }) =>
      tablesRepo.reorderTables(roomId, tableIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

export function useReorderRooms() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tablesRepo.reorderRooms,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.rooms() })
      queryClient.invalidateQueries({ queryKey: tableKeys.layout() })
    },
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export function useTableStatus(tableId: string) {
  return useQuery({
    queryKey: [...tableKeys.detail(tableId), 'status'],
    queryFn: () => tablesRepo.getTableStatus(tableId),
    enabled: !!tableId,
    staleTime: 15 * 1000, // 15 seconds for status
  })
}

export function useAvailableTables(roomId?: string, capacity?: number) {
  return useQuery({
    queryKey: [...tableKeys.lists(), 'available', roomId, capacity],
    queryFn: () => tablesRepo.getAvailableTables(roomId, capacity),
    staleTime: 30 * 1000,
  })
}

export function useTableCapacity(tableId: string) {
  return useQuery({
    queryKey: [...tableKeys.detail(tableId), 'capacity'],
    queryFn: () => tablesRepo.getTableCapacity(tableId),
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000,
  })
}

// ================================================
// TABLE OPERATIONS
// ================================================

export function useTableOperations(tableId: string) {
  const table = useTable(tableId)
  const tableStatus = useTableStatus(tableId)
  
  const operations = {
    canEdit: !tableStatus.data?.hasActiveOrders,
    canDelete: !tableStatus.data?.hasActiveOrders,
    canMove: !tableStatus.data?.hasActiveOrders,
    canResize: true,
    canReorder: true,
    isOccupied: tableStatus.data?.hasActiveOrders || false,
    orderCount: tableStatus.data?.orderCount || 0,
    totalAmount: tableStatus.data?.totalAmount || 0,
  }
  
  return {
    table: table.data,
    status: tableStatus.data,
    operations,
    isLoading: table.isLoading || tableStatus.isLoading,
    error: table.error || tableStatus.error,
  }
}

// ================================================
// ROOM OPERATIONS
// ================================================

export function useRoomOperations(roomId: string) {
  const room = useRoom(roomId)
  const roomTables = useRoomTables(roomId)
  
  const operations = {
    canEdit: true,
    canDelete: (roomTables.data?.length || 0) === 0,
    canReorder: true,
    tableCount: roomTables.data?.length || 0,
    hasTables: (roomTables.data?.length || 0) > 0,
  }
  
  return {
    room: room.data,
    tables: roomTables.data || [],
    operations,
    isLoading: room.isLoading || roomTables.isLoading,
    error: room.error || roomTables.error,
  }
}

// ================================================
// TABLE SEARCH & FILTERING
// ================================================

export function useTableSearch(query: string, roomId?: string) {
  const tables = roomId ? useRoomTables(roomId) : useTables()
  
  if (!query.trim()) {
    return {
      ...tables,
      data: tables.data || [],
    }
  }
  
  const filteredData = tables.data?.filter(table =>
    table.name.toLowerCase().includes(query.toLowerCase()) ||
    table.room?.name.toLowerCase().includes(query.toLowerCase())
  ) || []
  
  return {
    ...tables,
    data: filteredData,
  }
}

export function useTablesByCapacity(minCapacity: number, maxCapacity?: number) {
  const tables = useTables()
  
  const filteredData = tables.data?.filter(table => {
    if (maxCapacity) {
      return table.capacity >= minCapacity && table.capacity <= maxCapacity
    }
    return table.capacity >= minCapacity
  }) || []
  
  return {
    ...tables,
    data: filteredData,
  }
}

// ================================================
// TABLE ANALYTICS
// ================================================

export function useTableAnalytics() {
  const tables = useTables()
  const rooms = useRooms()
  
  const analytics = {
    totalTables: tables.data?.length || 0,
    totalRooms: rooms.data?.length || 0,
    totalCapacity: tables.data?.reduce((sum, table) => sum + table.capacity, 0) || 0,
    averageCapacity: tables.data?.length ? 
      tables.data.reduce((sum, table) => sum + table.capacity, 0) / tables.data.length : 0,
    byRoom: rooms.data?.map(room => ({
      room,
      tableCount: tables.data?.filter(table => table.room_id === room.id).length || 0,
      totalCapacity: tables.data?.filter(table => table.room_id === room.id)
        .reduce((sum, table) => sum + table.capacity, 0) || 0,
    })) || [],
    occupancyRate: 0, // Would need order data to calculate
  }
  
  return {
    ...tables,
    ...rooms,
    analytics,
  }
}

// ================================================
// REAL-TIME UPDATES (if using Supabase realtime)
// ================================================

export function useTableRealtime(roomId?: string) {
  // This would integrate with Supabase realtime subscriptions
  // For now, we'll use polling with shorter stale times
  
  const tables = roomId ? useRoomTables(roomId) : useTables()
  const layout = useTableLayout(roomId)
  
  // Refresh data more frequently for real-time feel
  const refreshInterval = 10000 // 10 seconds
  
  return {
    tables: {
      ...tables,
      refetchInterval: refreshInterval,
    },
    layout: {
      ...layout,
      refetchInterval: refreshInterval,
    },
  }
}
