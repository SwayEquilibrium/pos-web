import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// PAYMENTS API - PAYMENT MANAGEMENT
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const orderId = searchParams.get('orderId')
    const paymentId = searchParams.get('paymentId')
    
    if (paymentId) {
      return await getPayment(supabase, paymentId)
    }
    
    if (orderId) {
      return await getOrderPayments(supabase, orderId)
    }
    
    return await getPayments(supabase)
  } catch (error) {
    console.error('Payments API error:', error)
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
    
    return await createPayment(supabase, body)
  } catch (error) {
    console.error('Payments API error:', error)
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
    
    return await updatePayment(supabase, body)
  } catch (error) {
    console.error('Payments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ================================================
// IMPLEMENTATION FUNCTIONS
// ================================================

async function getPayment(supabase: any, paymentId: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      order:orders(order_number, total_amount, status),
      payment_type:payment_types(name, code)
    `)
    .eq('id', paymentId)
    .single()
  
  if (error) {
    console.error('Payment query error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getOrderPayments(supabase: any, orderId: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      payment_type:payment_types(name, code)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Order payments query error:', error)
    return NextResponse.json({ error: 'Failed to fetch order payments' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getPayments(supabase: any) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      order:orders(order_number, total_amount),
      payment_type:payment_types(name, code)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Payments query error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createPayment(supabase: any, body: any) {
  const { 
    order_id, 
    payment_method, 
    amount, 
    payment_type_id,
    reference_number,
    cash_received,
    change_given,
    metadata,
    notes 
  } = body
  
  if (!order_id || !payment_method || amount === undefined) {
    return NextResponse.json({ error: 'Order ID, payment method, and amount are required' }, { status: 400 })
  }
  
  // Check if order exists and get total
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('id', order_id)
    .single()
  
  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  
  if (order.status === 'paid') {
    return NextResponse.json({ error: 'Order is already paid' }, { status: 400 })
  }
  
  // Calculate fees if payment type is specified
  let fee_amount = 0
  let net_amount = amount
  
  if (payment_type_id) {
    const { data: paymentType } = await supabase
      .from('payment_types')
      .select('fee_percentage, fee_fixed')
      .eq('id', payment_type_id)
      .single()
    
    if (paymentType) {
      fee_amount = (amount * paymentType.fee_percentage / 100) + paymentType.fee_fixed
      net_amount = amount - fee_amount
    }
  }
  
  // Generate payment ID
  const payment_id = crypto.randomUUID()
  
  // Create payment transaction
  const { data: payment, error: paymentError } = await supabase
    .from('payment_transactions')
    .insert({
      id: payment_id,
      payment_id,
      order_id,
      order_number: order.order_number,
      payment_type_id,
      payment_method,
      amount,
      fee_amount,
      net_amount,
      reference_number,
      cash_received,
      change_given,
      status: 'completed',
      currency: 'DKK',
      metadata,
      notes
    })
    .select()
    .single()
  
  if (paymentError) {
    console.error('Payment creation error:', paymentError)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
  
  // Update order status to paid
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ 
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('id', order_id)
  
  if (orderUpdateError) {
    console.error('Order status update error:', orderUpdateError)
    // Payment was created but order update failed
    return NextResponse.json({ 
      data: payment,
      warning: 'Payment created but order status update failed' 
    })
  }
  
  // Log payment activity
  await supabase
    .from('payment_logs')
    .insert({
      order_id,
      payment_method,
      amount,
      currency: 'DKK',
      status: 'completed',
      transaction_reference: reference_number,
      processed_at: new Date().toISOString()
    })
  
  return NextResponse.json({ data: payment })
}

async function updatePayment(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('payment_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
