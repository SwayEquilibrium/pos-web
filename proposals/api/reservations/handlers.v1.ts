// Reservation API Handlers v1.0
// Backend handlers for reservation management

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function createReservationHandler(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      customer_name,
      customer_phone,
      customer_email,
      party_size,
      reservation_date,
      reservation_time,
      duration_minutes = 120,
      special_requests,
      table_ids,
      location_id
    } = body
    
    // Validate required fields
    if (!customer_name || !party_size || !reservation_date || !reservation_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate party size
    if (party_size < 1 || party_size > 50) {
      return NextResponse.json(
        { error: 'Party size must be between 1 and 50' },
        { status: 400 }
      )
    }
    
    // Validate reservation time is in the future
    const reservationDateTime = new Date(`${reservation_date} ${reservation_time}`)
    if (reservationDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Reservation time must be in the future' },
        { status: 400 }
      )
    }
    
    // Create reservation using the database function
    const { data: reservationId, error } = await supabase.rpc('create_reservation', {
      p_tenant_id: 'current-tenant', // Would get from JWT/auth context in real app
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_customer_email: customer_email,
      p_party_size: party_size,
      p_reservation_date: reservation_date,
      p_reservation_time: reservation_time,
      p_duration_minutes: duration_minutes,
      p_special_requests: special_requests,
      p_table_ids: table_ids,
      p_location_id: location_id
    })
    
    if (error) {
      console.error('Reservation creation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create reservation' },
        { status: 500 }
      )
    }
    
    // Fetch the created reservation details
    const { data: reservation, error: fetchError } = await supabase
      .from('reservation_details')
      .select('*')
      .eq('id', reservationId)
      .single()
    
    if (fetchError) {
      console.error('Fetch reservation error:', fetchError)
      // Still return success since reservation was created
      return NextResponse.json({ 
        id: reservationId,
        message: 'Reservation created successfully'
      })
    }
    
    return NextResponse.json(reservation)
    
  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function getReservationsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const customer_phone = searchParams.get('customer_phone')
    
    let query = supabase
      .from('reservation_details')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })
    
    // Apply filters
    if (date) {
      query = query.eq('reservation_date', date)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (customer_phone) {
      query = query.ilike('customer_phone', `%${customer_phone}%`)
    }
    
    const { data: reservations, error } = await query
    
    if (error) {
      console.error('Get reservations error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(reservations || [])
    
  } catch (error) {
    console.error('Get reservations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
