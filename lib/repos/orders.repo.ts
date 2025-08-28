import { supabase } from '@/lib/supabaseClient'

// ================================================
// ORDERS REPOSITORY - ORDER MANAGEMENT
// ================================================

// Types
export interface Order {
  id: string
  table_id?: string
  order_number: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  total_amount: number
  tax_amount: number
  discount_amount: number
  tip_amount: number
  payment_method?: string
  customer_count: number
  notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  paid_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  category_id: string
  quantity: number
  unit_price: number
  total_price: number
  modifiers_total: number
  special_instructions?: string
  product_name: string
  category_name: string
  category_path?: string
  created_at: string
}

export interface OrderModifier {
  id: string
  order_item_id: string
  modifier_group_id: string
  modifier_id: string
  modifier_name: string
  modifier_group_name: string
  price: number
  quantity: number
  created_at: string
}

// ================================================
// ORDERS
// ================================================

export async function getOrder(orderId: string): Promise<Order & { 
  table?: any
  items?: OrderItem[]
}> {
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
    console.error('[getOrder] Query error:', error)
    throw new Error(`Failed to fetch order: ${error.message}`)
  }
  
  return data
}

export async function getTableOrders(tableId: string): Promise<Order[]> {
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
    console.error('[getTableOrders] Query error:', error)
    throw new Error(`Failed to fetch table orders: ${error.message}`)
  }
  
  return data || []
}

export async function getOrders(status?: string): Promise<Order[]> {
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
    console.error('[getOrders] Query error:', error)
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }
  
  return data || []
}

export async function createOrder(data: {
  table_id: string
  items: Array<{
    product_id: string
    category_id: string
    quantity: number
    unit_price: number
    product_name: string
    category_name: string
    special_instructions?: string
  }>
  customer_count?: number
  notes?: string
}): Promise<Order> {
  const { table_id, items, customer_count = 1, notes } = data
  
  if (!table_id || !items || items.length === 0) {
    throw new Error('Table ID and items are required')
  }
  
  // Generate order number
  const { data: orderNumber, error: orderNumberError } = await supabase.rpc('generate_order_number')
  
  if (orderNumberError) {
    console.error('[createOrder] Order number generation error:', orderNumberError)
    throw new Error(`Failed to generate order number: ${orderNumberError.message}`)
  }
  
  // Calculate totals
  const total_amount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const tax_amount = total_amount * 0.25 // Simplified tax calculation
  const discount_amount = 0
  const tip_amount = 0
  
  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id,
      order_number: orderNumber,
      customer_count,
      notes,
      status: 'pending',
      total_amount,
      tax_amount,
      discount_amount,
      tip_amount
    })
    .select()
    .single()
  
  if (orderError) {
    console.error('[createOrder] Order creation error:', orderError)
    throw new Error(`Failed to create order: ${orderError.message}`)
  }
  
  // Create order items
  const orderItems = items.map((item) => ({
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
    console.error('[createOrder] Order items creation error:', itemsError)
    // Delete the order if items fail
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(`Failed to create order items: ${itemsError.message}`)
  }
  
  return order
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updateOrder] Update error:', error)
    throw new Error(`Failed to update order: ${error.message}`)
  }
  
  return data
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[deleteOrder] Delete error:', error)
    throw new Error(`Failed to delete order: ${error.message}`)
  }
}

// ================================================
// ORDER ITEMS
// ================================================

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at')
  
  if (error) {
    console.error('[getOrderItems] Query error:', error)
    throw new Error(`Failed to fetch order items: ${error.message}`)
  }
  
  return data || []
}

export async function addOrderItem(data: {
  order_id: string
  product_id: string
  category_id: string
  quantity: number
  unit_price: number
  product_name: string
  category_name: string
  special_instructions?: string
}): Promise<OrderItem> {
  const { order_id, product_id, category_id, quantity, unit_price, product_name, category_name, special_instructions } = data
  
  if (!order_id || !product_id || !category_id || quantity <= 0 || unit_price < 0) {
    throw new Error('Valid order ID, product ID, category ID, quantity, and unit price are required')
  }
  
  const total_price = unit_price * quantity
  
  const { data: orderItem, error } = await supabase
    .from('order_items')
    .insert({
      order_id,
      product_id,
      category_id,
      quantity,
      unit_price,
      total_price,
      product_name,
      category_name,
      special_instructions
    })
    .select()
    .single()
  
  if (error) {
    console.error('[addOrderItem] Insert error:', error)
    throw new Error(`Failed to add order item: ${error.message}`)
  }
  
  // Update order total
  await updateOrderTotal(order_id)
  
  return orderItem
}

export async function updateOrderItem(id: string, updates: Partial<OrderItem>): Promise<OrderItem> {
  const { data, error } = await supabase
    .from('order_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updateOrderItem] Update error:', error)
    throw new Error(`Failed to update order item: ${error.message}`)
  }
  
  // Update order total if price or quantity changed
  if (updates.unit_price || updates.quantity) {
    await updateOrderTotal(data.order_id)
  }
  
  return data
}

export async function removeOrderItem(id: string): Promise<void> {
  const { data: orderItem, error: fetchError } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('[removeOrderItem] Fetch error:', fetchError)
    throw new Error(`Failed to fetch order item: ${fetchError.message}`)
  }
  
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[removeOrderItem] Delete error:', error)
    throw new Error(`Failed to remove order item: ${error.message}`)
  }
  
  // Update order total
  if (orderItem) {
    await updateOrderTotal(orderItem.order_id)
  }
}

// ================================================
// ORDER MODIFIERS
// ================================================

export async function getOrderModifiers(orderItemId: string): Promise<OrderModifier[]> {
  const { data, error } = await supabase
    .from('order_item_modifiers')
    .select('*')
    .eq('order_item_id', orderItemId)
    .order('created_at')
  
  if (error) {
    console.error('[getOrderModifiers] Query error:', error)
    throw new Error(`Failed to fetch order modifiers: ${error.message}`)
  }
  
  return data || []
}

export async function addOrderModifier(data: {
  order_item_id: string
  modifier_group_id: string
  modifier_id: string
  modifier_name: string
  modifier_group_name: string
  price: number
  quantity?: number
}): Promise<OrderModifier> {
  const { order_item_id, modifier_group_id, modifier_id, modifier_name, modifier_group_name, price, quantity = 1 } = data
  
  if (!order_item_id || !modifier_group_id || !modifier_id || price < 0 || quantity <= 0) {
    throw new Error('Valid order item ID, modifier group ID, modifier ID, price, and quantity are required')
  }
  
  const { data: orderModifier, error } = await supabase
    .from('order_item_modifiers')
    .insert({
      order_item_id,
      modifier_group_id,
      modifier_id,
      modifier_name,
      modifier_group_name,
      price,
      quantity
    })
    .select()
    .single()
  
  if (error) {
    console.error('[addOrderModifier] Insert error:', error)
    throw new Error(`Failed to add order modifier: ${error.message}`)
  }
  
  // Update order item modifiers total
  await updateOrderItemModifiersTotal(order_item_id)
  
  return orderModifier
}

export async function removeOrderModifier(id: string): Promise<void> {
  const { data: orderModifier, error: fetchError } = await supabase
    .from('order_item_modifiers')
    .select('order_item_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('[removeOrderModifier] Fetch error:', fetchError)
    throw new Error(`Failed to fetch order modifier: ${fetchError.message}`)
  }
  
  const { error } = await supabase
    .from('order_item_modifiers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[removeOrderModifier] Delete error:', error)
    throw new Error(`Failed to remove order modifier: ${error.message}`)
  }
  
  // Update order item modifiers total
  if (orderModifier) {
    await updateOrderItemModifiersTotal(orderModifier.order_item_id)
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

async function updateOrderTotal(orderId: string): Promise<void> {
  // Get all order items with their totals
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('total_price, modifiers_total')
    .eq('order_id', orderId)
  
  if (itemsError) {
    console.error('[updateOrderTotal] Items query error:', itemsError)
    return
  }
  
  // Calculate new total
  const total_amount = (orderItems || []).reduce((sum, item) => {
    return sum + item.total_price + (item.modifiers_total || 0)
  }, 0)
  
  const tax_amount = total_amount * 0.25 // Simplified tax calculation
  
  // Update order
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      total_amount,
      tax_amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
  
  if (updateError) {
    console.error('[updateOrderTotal] Update error:', updateError)
  }
}

async function updateOrderItemModifiersTotal(orderItemId: string): Promise<void> {
  // Get all modifiers for this order item
  const { data: modifiers, error: modifiersError } = await supabase
    .from('order_item_modifiers')
    .select('price, quantity')
    .eq('order_item_id', orderItemId)
  
  if (modifiersError) {
    console.error('[updateOrderItemModifiersTotal] Modifiers query error:', modifiersError)
    return
  }
  
  // Calculate modifiers total
  const modifiers_total = (modifiers || []).reduce((sum, modifier) => {
    return sum + (modifier.price * modifier.quantity)
  }, 0)
  
  // Update order item
  const { error: updateError } = await supabase
    .from('order_items')
    .update({
      modifiers_total,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderItemId)
  
  if (updateError) {
    console.error('[updateOrderItemModifiersTotal] Update error:', updateError)
  }
}
