import { supabase } from '@/lib/supabaseClient'

// ================================================
// TABLES REPOSITORY - TABLE MANAGEMENT
// ================================================

// Types
export interface Table {
  id: string
  room_id?: string
  name: string
  capacity: number
  x: number
  y: number
  width: number
  height: number
  active: boolean
  sort_index: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description?: string
  color: string
  sort_index: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface TableWithOrders extends Table {
  room?: Room
  orders?: Array<{
    id: string
    order_number: string
    status: string
    total_amount: number
    created_at: string
  }>
}

// ================================================
// TABLES
// ================================================

export async function getTable(tableId: string): Promise<TableWithOrders> {
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      room:rooms(name, color),
      orders:orders(
        id, order_number, status, total_amount, created_at
      )
    `)
    .eq('id', tableId)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('[getTable] Query error:', error)
    throw new Error(`Failed to fetch table: ${error.message}`)
  }
  
  return data
}

export async function getRoomTables(roomId: string): Promise<TableWithOrders[]> {
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      orders:orders(
        id, order_number, status, total_amount, created_at
      )
    `)
    .eq('room_id', roomId)
    .eq('active', true)
    .order('sort_index')
  
  if (error) {
    console.error('[getRoomTables] Query error:', error)
    throw new Error(`Failed to fetch room tables: ${error.message}`)
  }
  
  return data || []
}

export async function getTables(): Promise<TableWithOrders[]> {
  const { data, error } = await supabase
    .from('tables')
    .select(`
      *,
      room:rooms(name, color),
      orders:orders(
        id, order_number, status, total_amount, created_at
      )
    `)
    .eq('active', true)
    .order('room_id, sort_index')
  
  if (error) {
    console.error('[getTables] Query error:', error)
    throw new Error(`Failed to fetch tables: ${error.message}`)
  }
  
  return data || []
}

export async function createTable(data: {
  name: string
  room_id: string
  capacity?: number
  x?: number
  y?: number
  width?: number
  height?: number
}): Promise<Table> {
  const { name, room_id, capacity = 4, x = 0, y = 0, width = 60, height = 60 } = data
  
  if (!name || !room_id) {
    throw new Error('Table name and room ID are required')
  }
  
  // Get next sort index for the room
  const { data: maxSort } = await supabase
    .from('tables')
    .select('sort_index')
    .eq('room_id', room_id)
    .order('sort_index', { ascending: false })
    .limit(1)
    .single()
  
  const sort_index = (maxSort?.sort_index || 0) + 1
  
  const { data: table, error } = await supabase
    .from('tables')
    .insert({
      name,
      room_id,
      capacity,
      x,
      y,
      width,
      height,
      sort_index,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[createTable] Insert error:', error)
    throw new Error(`Failed to create table: ${error.message}`)
  }
  
  return table
}

export async function updateTable(id: string, updates: Partial<Table>): Promise<Table> {
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updateTable] Update error:', error)
    throw new Error(`Failed to update table: ${error.message}`)
  }
  
  return data
}

export async function deleteTable(id: string): Promise<void> {
  // Check if table has active orders
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', id)
    .in('status', ['pending', 'preparing', 'ready'])
    .limit(1)
  
  if (activeOrders && activeOrders.length > 0) {
    throw new Error('Cannot delete table with active orders')
  }
  
  // Soft delete the table
  const { error } = await supabase
    .from('tables')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('[deleteTable] Delete error:', error)
    throw new Error(`Failed to delete table: ${error.message}`)
  }
}

export async function reorderTables(roomId: string, tableIds: string[]): Promise<void> {
  // Update sort indices for tables in the room
  for (let i = 0; i < tableIds.length; i++) {
    const { error } = await supabase
      .from('tables')
      .update({ sort_index: i + 1 })
      .eq('id', tableIds[i])
      .eq('room_id', roomId)
    
    if (error) {
      console.error('[reorderTables] Update error:', error)
      throw new Error(`Failed to reorder tables: ${error.message}`)
    }
  }
}

export async function moveTable(tableId: string, roomId: string, x: number, y: number): Promise<void> {
  // Get next sort index for the new room
  const { data: maxSort } = await supabase
    .from('tables')
    .select('sort_index')
    .eq('room_id', roomId)
    .order('sort_index', { ascending: false })
    .limit(1)
    .single()
  
  const sort_index = (maxSort?.sort_index || 0) + 1
  
  const { error } = await supabase
    .from('tables')
    .update({
      room_id: roomId,
      x,
      y,
      sort_index
    })
    .eq('id', tableId)
  
  if (error) {
    console.error('[moveTable] Update error:', error)
    throw new Error(`Failed to move table: ${error.message}`)
  }
}

// ================================================
// ROOMS
// ================================================

export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('active', true)
    .order('sort_index')
  
  if (error) {
    console.error('[getRooms] Query error:', error)
    throw new Error(`Failed to fetch rooms: ${error.message}`)
  }
  
  return data || []
}

export async function getRoom(roomId: string): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('[getRoom] Query error:', error)
    throw new Error(`Failed to fetch room: ${error.message}`)
  }
  
  return data
}

export async function createRoom(data: {
  name: string
  description?: string
  color?: string
  sort_index?: number
}): Promise<Room> {
  const { name, description, color = '#3B82F6', sort_index = 0 } = data
  
  if (!name) {
    throw new Error('Room name is required')
  }
  
  // Get next sort index if not provided
  let finalSortIndex = sort_index
  if (sort_index === 0) {
    const { data: maxSort } = await supabase
      .from('rooms')
      .select('sort_index')
      .order('sort_index', { ascending: false })
      .limit(1)
      .single()
    
    finalSortIndex = (maxSort?.sort_index || 0) + 1
  }
  
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name,
      description,
      color,
      sort_index: finalSortIndex,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[createRoom] Insert error:', error)
    throw new Error(`Failed to create room: ${error.message}`)
  }
  
  return room
}

export async function updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updateRoom] Update error:', error)
    throw new Error(`Failed to update room: ${error.message}`)
  }
  
  return data
}

export async function deleteRoom(id: string): Promise<void> {
  // Check if room has tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id')
    .eq('room_id', id)
    .eq('active', true)
    .limit(1)
  
  if (tables && tables.length > 0) {
    throw new Error('Cannot delete room with tables')
  }
  
  // Soft delete the room
  const { error } = await supabase
    .from('rooms')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('[deleteRoom] Delete error:', error)
    throw new Error(`Failed to delete room: ${error.message}`)
  }
}

export async function reorderRooms(roomIds: string[]): Promise<void> {
  // Update sort indices for rooms
  for (let i = 0; i < roomIds.length; i++) {
    const { error } = await supabase
      .from('rooms')
      .update({ sort_index: i + 1 })
      .eq('id', roomIds[i])
    
    if (error) {
      console.error('[reorderRooms] Update error:', error)
      throw new Error(`Failed to reorder rooms: ${error.message}`)
    }
  }
}

// ================================================
// TABLE LAYOUT
// ================================================

export async function getTableLayout(roomId?: string): Promise<{
  rooms: Room[]
  tables: TableWithOrders[]
}> {
  const rooms = await getRooms()
  const tables = roomId ? await getRoomTables(roomId) : await getTables()
  
  return { rooms, tables }
}

export async function updateTablePosition(tableId: string, x: number, y: number): Promise<void> {
  const { error } = await supabase
    .from('tables')
    .update({ x, y })
    .eq('id', tableId)
  
  if (error) {
    console.error('[updateTablePosition] Update error:', error)
    throw new Error(`Failed to update table position: ${error.message}`)
  }
}

export async function updateTableSize(tableId: string, width: number, height: number): Promise<void> {
  if (width <= 0 || height <= 0) {
    throw new Error('Table dimensions must be positive')
  }
  
  const { error } = await supabase
    .from('tables')
    .update({ width, height })
    .eq('id', tableId)
  
  if (error) {
    console.error('[updateTableSize] Update error:', error)
    throw new Error(`Failed to update table size: ${error.message}`)
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export async function getTableStatus(tableId: string): Promise<{
  table: Table
  hasActiveOrders: boolean
  orderCount: number
  totalAmount: number
}> {
  const table = await getTable(tableId)
  
  const activeOrders = table.orders?.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  ) || []
  
  const hasActiveOrders = activeOrders.length > 0
  const orderCount = activeOrders.length
  const totalAmount = activeOrders.reduce((sum, order) => sum + order.total_amount, 0)
  
  return {
    table,
    hasActiveOrders,
    orderCount,
    totalAmount
  }
}

export async function getAvailableTables(roomId?: string, capacity?: number): Promise<Table[]> {
  let query = supabase
    .from('tables')
    .select('*')
    .eq('active', true)
    .not('id', 'in', 
      supabase
        .from('orders')
        .select('table_id')
        .in('status', ['pending', 'preparing', 'ready'])
    )
  
  if (roomId) {
    query = query.eq('room_id', roomId)
  }
  
  if (capacity) {
    query = query.gte('capacity', capacity)
  }
  
  const { data, error } = await query.order('sort_index')
  
  if (error) {
    console.error('[getAvailableTables] Query error:', error)
    throw new Error(`Failed to fetch available tables: ${error.message}`)
  }
  
  return data || []
}

export async function getTableCapacity(tableId: string): Promise<number> {
  const { data, error } = await supabase
    .from('tables')
    .select('capacity')
    .eq('id', tableId)
    .single()
  
  if (error) {
    console.error('[getTableCapacity] Query error:', error)
    throw new Error(`Failed to fetch table capacity: ${error.message}`)
  }
  
  return data.capacity
}
