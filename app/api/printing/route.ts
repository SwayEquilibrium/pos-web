import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// SIMPLE PRINTER API - JUST WORKS
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'printers') {
      const { data, error } = await supabase
        .from('printers')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) {
        console.error('❌ Database error:', error)
        return NextResponse.json({ error: 'Failed to fetch printers' }, { status: 500 })
      }
      
      return NextResponse.json({ data })
    }
    
    return NextResponse.json({ message: 'Simple Printer API - Just Works' })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'printer') {
      const body = await request.json()
      console.log('🔧 Creating printer:', body)
      
      // Just need name and IP address
      const { name, connection_string } = body
      
      if (!name || !connection_string) {
        return NextResponse.json({ 
          error: 'Name and IP address are required' 
        }, { status: 400 })
      }
      
      // Create printer with sensible defaults
      const { data, error } = await supabase
        .from('printers')
        .insert({
          name,
          display_name: name,
          printer_type: 'Direct IP',
          connection_string,
          brand: 'Star',
          paper_width: 48,
          supports_cut: true,
          cut_command_hex: '1B6401',
          cut_command_name: 'ESC d 1 (Partial Cut)',
          print_kitchen_receipts: true,
          print_customer_receipts: false,
          auto_print_on_order: true,
          auto_print_on_payment: false,
          is_active: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Database error:', error)
        return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
      }
      
      console.log('✅ Printer created:', data)
      return NextResponse.json({ data })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Printer ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('printers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Update error:', error)
      return NextResponse.json({ error: 'Failed to update printer' }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Printer ID required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('printers')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) {
      console.error('❌ Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
