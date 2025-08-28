import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// TABLES API - TABLE MANAGEMENT
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const roomId = searchParams.get('roomId')
    const tableId = searchParams.get('tableId')
    
    if (tableId) {
      return await getTable(supabase, tableId)
    }
    
    if (roomId) {
      return await getRoomTables(supabase, roomId)
    }
  
    return await getTables(supabase)
  } catch (error) {
    console.error('Tables API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    return await createTable(supabase, body)
  } catch (error) {
    console.error('Tables API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    return await updateTable(supabase, body)
  } catch (error) {
    console.error('Tables API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
    }
    
    return await deleteTable(supabase, id)
  } catch (error) {
    console.error('Tables API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ================================================
// IMPLEMENTATION FUNCTIONS
// ================================================

async function getTable(supabase: any, tableId: string) {
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
    console.error('Table query error:', error)
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getRoomTables(supabase: any, roomId: string) {
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
    console.error('Room tables query error:', error)
    return NextResponse.json({ error: 'Failed to fetch room tables' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getTables(supabase: any) {
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
    console.error('Tables query error:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createTable(supabase: any, body: any) {
  const { name, room_id, capacity, x, y, width, height } = body
  
  if (!name || !room_id) {
    return NextResponse.json({ error: 'Table name and room ID are required' }, { status: 400 })
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
  
  const { data, error } = await supabase
    .from('tables')
    .insert({
      name,
      room_id,
      capacity: capacity || 4,
      x: x || 0,
      y: y || 0,
      width: width || 60,
      height: height || 60,
      sort_index,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('Table creation error:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function updateTable(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Table update error:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function deleteTable(supabase: any, id: string) {
  // Check if table has active orders
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', id)
    .in('status', ['pending', 'preparing', 'ready'])
    .limit(1)
  
  if (activeOrders && activeOrders.length > 0) {
    return NextResponse.json({ 
      error: 'Cannot delete table with active orders' 
    }, { status: 400 })
  }
  
  // Soft delete the table
  const { error } = await supabase
    .from('tables')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Table deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
