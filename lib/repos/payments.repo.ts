import { supabase } from '@/lib/supabaseClient'

// ================================================
// PAYMENTS REPOSITORY - PAYMENT MANAGEMENT
// ================================================

// Types
export interface PaymentTransaction {
  id: string
  payment_id: string
  reference_number?: string
  order_id?: string
  order_number?: string
  payment_type_id?: string
  payment_method: string
  amount: number
  fee_amount: number
  net_amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  currency: string
  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
  metadata?: any
  notes?: string
  idempotency_key?: string
}

export interface PaymentType {
  id: string
  code: string
  name: string
  description?: string
  requires_reference: boolean
  supports_partial: boolean
  fee_percentage: number
  fee_fixed: number
  active: boolean
  sort_order: number
}

export interface PaymentLog {
  id: string
  company_id?: string
  order_id?: string
  payment_method: string
  amount: number
  currency: string
  status: string
  transaction_reference?: string
  processed_by?: string
  processed_at?: string
  gateway_response?: any
  created_at: string
  updated_at: string
}

// ================================================
// PAYMENT TRANSACTIONS
// ================================================

export async function getPayment(paymentId: string): Promise<PaymentTransaction & {
  order?: any
  payment_type?: PaymentType
}> {
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
    console.error('[getPayment] Query error:', error)
    throw new Error(`Failed to fetch payment: ${error.message}`)
  }
  
  return data
}

export async function getOrderPayments(orderId: string): Promise<PaymentTransaction[]> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      payment_type:payment_types(name, code)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[getOrderPayments] Query error:', error)
    throw new Error(`Failed to fetch order payments: ${error.message}`)
  }
  
  return data || []
}

export async function getPayments(limit: number = 100): Promise<PaymentTransaction[]> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      order:orders(order_number, total_amount),
      payment_type:payment_types(name, code)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[getPayments] Query error:', error)
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }
  
  return data || []
}

export async function createPayment(data: {
  order_id: string
  payment_method: string
  amount: number
  payment_type_id?: string
  reference_number?: string
  cash_received?: number
  change_given?: number
  metadata?: any
  notes?: string
  idempotency_key?: string
}): Promise<PaymentTransaction> {
  const { 
    order_id, 
    payment_method, 
    amount, 
    payment_type_id,
    reference_number,
    cash_received,
    change_given,
    metadata,
    notes,
    idempotency_key
  } = data
  
  if (!order_id || !payment_method || amount === undefined) {
    throw new Error('Order ID, payment method, and amount are required')
  }
  
  // Check if order exists and get total
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('total_amount, status, order_number')
    .eq('id', order_id)
    .single()
  
  if (orderError || !order) {
    throw new Error('Order not found')
  }
  
  if (order.status === 'paid') {
    throw new Error('Order is already paid')
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
      notes,
      idempotency_key
    })
    .select()
    .single()
  
  if (paymentError) {
    console.error('[createPayment] Insert error:', paymentError)
    throw new Error(`Failed to create payment: ${paymentError.message}`)
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
    console.error('[createPayment] Order status update error:', orderUpdateError)
    // Payment was created but order update failed
    console.warn('Payment created but order status update failed')
  }
  
  // Log payment activity
  await logPaymentActivity({
    order_id,
    payment_method,
    amount,
    currency: 'DKK',
    status: 'completed',
    transaction_reference: reference_number
  })
  
  return payment
}

export async function updatePayment(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updatePayment] Update error:', error)
    throw new Error(`Failed to update payment: ${error.message}`)
  }
  
  return data
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase
    .from('payment_transactions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('[deletePayment] Delete error:', error)
    throw new Error(`Failed to delete payment: ${error.message}`)
  }
}

// ================================================
// PAYMENT TYPES
// ================================================

export async function getPaymentTypes(): Promise<PaymentType[]> {
  const { data, error } = await supabase
    .from('payment_types')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  
  if (error) {
    console.error('[getPaymentTypes] Query error:', error)
    throw new Error(`Failed to fetch payment types: ${error.message}`)
  }
  
  return data || []
}

export async function createPaymentType(data: {
  code: string
  name: string
  description?: string
  requires_reference?: boolean
  supports_partial?: boolean
  fee_percentage?: number
  fee_fixed?: number
  sort_order?: number
}): Promise<PaymentType> {
  const { 
    code, 
    name, 
    description, 
    requires_reference = false, 
    supports_partial = false, 
    fee_percentage = 0, 
    fee_fixed = 0, 
    sort_order = 0 
  } = data
  
  if (!code || !name) {
    throw new Error('Code and name are required')
  }
  
  const { data: paymentType, error } = await supabase
    .from('payment_types')
    .insert({
      code,
      name,
      description,
      requires_reference,
      supports_partial,
      fee_percentage,
      fee_fixed,
      sort_order,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('[createPaymentType] Insert error:', error)
    throw new Error(`Failed to create payment type: ${error.message}`)
  }
  
  return paymentType
}

export async function updatePaymentType(id: string, updates: Partial<PaymentType>): Promise<PaymentType> {
  const { data, error } = await supabase
    .from('payment_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[updatePaymentType] Update error:', error)
    throw new Error(`Failed to update payment type: ${error.message}`)
  }
  
  return data
}

export async function deletePaymentType(id: string): Promise<void> {
  const { error } = await supabase
    .from('payment_types')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('[deletePaymentType] Delete error:', error)
    throw new Error(`Failed to delete payment type: ${error.message}`)
  }
}

// ================================================
// PAYMENT LOGS
// ================================================

export async function getPaymentLogs(options?: {
  orderId?: string
  paymentMethod?: string
  status?: string
  limit?: number
}): Promise<PaymentLog[]> {
  const { orderId, paymentMethod, status, limit = 100 } = options || {}
  
  let query = supabase
    .from('payment_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (orderId) {
    query = query.eq('order_id', orderId)
  }
  
  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('[getPaymentLogs] Query error:', error)
    throw new Error(`Failed to fetch payment logs: ${error.message}`)
  }
  
  return data || []
}

async function logPaymentActivity(data: {
  order_id: string
  payment_method: string
  amount: number
  currency: string
  status: string
  transaction_reference?: string
}): Promise<void> {
  const { error } = await supabase
    .from('payment_logs')
    .insert({
      ...data,
      processed_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('[logPaymentActivity] Insert error:', error)
    // Don't throw error for logging failures
  }
}

// ================================================
// IDEMPOTENCY
// ================================================

export async function checkIdempotency(keyHash: string, resourceType: string, requestHash: string): Promise<{
  isNew: boolean
  existingResourceId?: string
  keyId: string
}> {
  const { data, error } = await supabase.rpc('check_idempotency_key', {
    p_key_hash: keyHash,
    p_resource_type: resourceType,
    p_request_hash: requestHash,
    p_ttl_minutes: 60
  })
  
  if (error) {
    console.error('[checkIdempotency] RPC error:', error)
    throw new Error(`Failed to check idempotency: ${error.message}`)
  }
  
  return data[0]
}

export async function updateIdempotencyResource(keyId: string, resourceId: string): Promise<void> {
  const { error } = await supabase.rpc('update_idempotency_resource', {
    p_key_id: keyId,
    p_resource_id: resourceId
  })
  
  if (error) {
    console.error('[updateIdempotencyResource] RPC error:', error)
    throw new Error(`Failed to update idempotency resource: ${error.message}`)
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

export async function getPaymentSummary(orderId: string): Promise<{
  total_paid: number
  remaining_balance: number
  payment_count: number
  last_payment_at?: string
}> {
  const payments = await getOrderPayments(orderId)
  
  const total_paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const payment_count = payments.length
  const last_payment_at = payments[0]?.created_at
  
  // Get order total
  const { data: order } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('id', orderId)
    .single()
  
  const order_total = order?.total_amount || 0
  const remaining_balance = Math.max(0, order_total - total_paid)
  
  return {
    total_paid,
    remaining_balance,
    payment_count,
    last_payment_at
  }
}

export async function refundPayment(paymentId: string, amount: number, reason?: string): Promise<PaymentTransaction> {
  if (amount <= 0) {
    throw new Error('Refund amount must be positive')
  }
  
  // Get original payment
  const originalPayment = await getPayment(paymentId)
  
  if (originalPayment.status !== 'completed') {
    throw new Error('Only completed payments can be refunded')
  }
  
  if (amount > originalPayment.amount) {
    throw new Error('Refund amount cannot exceed original payment amount')
  }
  
  // Create refund transaction
  const refundData = {
    order_id: originalPayment.order_id,
    payment_method: originalPayment.payment_method,
    amount: -amount, // Negative amount for refund
    reference_number: `REFUND-${originalPayment.reference_number || originalPayment.id}`,
    notes: reason || 'Payment refund',
    metadata: {
      refund_of: paymentId,
      reason
    }
  }
  
  const refund = await createPayment(refundData)
  
  // Update original payment status
  await updatePayment(paymentId, { status: 'refunded' })
  
  return refund
}
