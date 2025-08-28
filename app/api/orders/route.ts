import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// ORDERS API - ORDER MANAGEMENT
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const tableId = searchParams.get('tableId')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')
    
    if (orderId) {
      return await getOrder(supabase, orderId)
    }
    
    if (tableId) {
      return await getTableOrders(supabase, tableId)
    }
    
    return await getOrders(supabase, status)
  } catch (error) {
    console.error('Orders API error:', error)
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
    
    return await createOrder(supabase, body)
  } catch (error) {
    console.error('Orders API error:', error)
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
    
    return await updateOrder(supabase, body)
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ================================================
// IMPLEMENTATION FUNCTIONS
// ================================================

async function getOrder(supabase: any, orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(name, capacity),
      items:order_items(
        *,
        product:products(name, description),
        category:categories(name),
        modifiers:order_item_modifiers(
          *,
          modifier:modifiers(name, price_delta)
        )
      )
    `)
    .eq('id', orderId)
    .single()
  
  if (error) {
    console.error('Order query error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getTableOrders(supabase: any, tableId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(name, description),
        category:categories(name)
      )
    `)
    .eq('table_id', tableId)
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Table orders query error:', error)
    return NextResponse.json({ error: 'Failed to fetch table orders' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getOrders(supabase: any, status?: string) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      table:tables(name, capacity),
      items:order_items(count)
    `)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Orders query error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createOrder(supabase: any, body: any) {
  const { table_id, items, customer_count, notes } = body
  
  if (!table_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'Table ID and items are required' }, { status: 400 })
  }
  
  // Generate order number
  const { data: orderNumber } = await supabase.rpc('generate_order_number')
  
  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id,
      order_number: orderNumber,
      customer_count: customer_count || 1,
      notes,
      status: 'pending'
    })
    .select()
    .single()
  
  if (orderError) {
    console.error('Order creation error:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
  
  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    category_id: item.category_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    product_name: item.product_name,
    category_name: item.category_name,
    special_instructions: item.special_instructions
  }))
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
  
  if (itemsError) {
    console.error('Order items creation error:', itemsError)
    // Delete the order if items fail
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }
  
  return NextResponse.json({ data: order })
}

async function updateOrder(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
