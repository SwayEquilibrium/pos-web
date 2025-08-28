import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// PRINTING API - PRINTER MANAGEMENT & CLOUDPRNT
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const printerId = searchParams.get('printerId')
    const action = searchParams.get('action')
    
    switch (action) {
      case 'printers':
        return await getPrinters(supabase)
      case 'jobs':
        return await getPrintJobs(supabase, printerId)
      case 'status':
        return await getPrinterStatus(supabase, printerId)
      default:
        return NextResponse.json({
          message: 'Printing API',
          version: '2.0.0',
          endpoints: {
            printers: '/api/printing?action=printers',
            jobs: '/api/printing?action=jobs',
            status: '/api/printing?action=status'
          }
        })
    }
  } catch (error) {
    console.error('Printing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()
    
    switch (action) {
      case 'enqueue':
        return await enqueuePrintJob(supabase, body)
      case 'printer':
        return await createPrinter(supabase, body)
      default:
        return NextResponse.json(
          { error: 'Action parameter required for POST requests' }, 
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Printing API error:', error)
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
    
    return await updatePrinter(supabase, body)
  } catch (error) {
    console.error('Printing API error:', error)
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
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 })
    }
    
    return await deletePrinter(supabase, id)
  } catch (error) {
    console.error('Printing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ================================================
// IMPLEMENTATION FUNCTIONS
// ================================================

async function getPrinters(supabase: any) {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('active', true)
    .order('name')
  
  if (error) {
    console.error('Printers query error:', error)
    return NextResponse.json({ error: 'Failed to fetch printers' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getPrintJobs(supabase: any, printerId?: string) {
  let query = supabase
    .from('print_jobs')
    .select('id, printer_id, status, content_type, created_at, delivered_at, printed_at, receipt_type')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (printerId) {
    query = query.eq('printer_id', printerId)
  }
  
  const { data: jobs, error } = await query
  
  if (error) {
    console.error('Print jobs query error:', error)
    return NextResponse.json({ error: 'Failed to fetch print jobs' }, { status: 500 })
  }
  
  // Get summary stats
  const { data: stats } = await supabase
    .from('print_jobs')
    .select('status, printer_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
  
  const summary = stats?.reduce((acc: any, job: any) => {
    acc.total = (acc.total || 0) + 1
    acc.byStatus = acc.byStatus || {}
    acc.byStatus[job.status] = (acc.byStatus[job.status] || 0) + 1
    acc.byPrinter = acc.byPrinter || {}
    acc.byPrinter[job.printer_id] = (acc.byPrinter[job.printer_id] || 0) + 1
    return acc
  }, {})
  
  return NextResponse.json({
    jobs,
    summary,
    timestamp: new Date().toISOString()
  })
}

async function getPrinterStatus(supabase: any, printerId?: string) {
  if (!printerId) {
    return NextResponse.json({ error: 'Printer ID required for status check' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('printers')
    .select('id, name, type, connection_type, active, last_heartbeat')
    .eq('id', printerId)
    .single()
  
  if (error) {
    console.error('Printer status query error:', error)
    return NextResponse.json({ error: 'Failed to fetch printer status' }, { status: 500 })
  }
  
  // Get recent print jobs for this printer
  const { data: recentJobs } = await supabase
    .from('print_jobs')
    .select('status, created_at')
    .eq('printer_id', printerId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return NextResponse.json({
    printer: data,
    recentJobs,
    status: 'online' // Simplified status for now
  })
}

async function enqueuePrintJob(supabase: any, body: any) {
  const { printerId, payload, contentType = 'text/plain', orderId, receiptType } = body
  
  if (!printerId || !payload) {
    return NextResponse.json(
      { error: 'printerId and payload are required' },
      { status: 400 }
    )
  }
  
  if (typeof payload !== 'string') {
    return NextResponse.json(
      { error: 'payload must be a string' },
      { status: 400 }
    )
  }
  
  // Check if printer exists and is active
  const { data: printer, error: printerError } = await supabase
    .from('printers')
    .select('id, name, active')
    .eq('id', printerId)
    .eq('active', true)
    .single()
  
  if (printerError || !printer) {
    return NextResponse.json(
      { error: 'Printer not found or inactive' },
      { status: 404 }
    )
  }
  
  // Encode payload as Base64 if it contains ESC/POS commands
  let encodedPayload = payload
  let isBase64 = false
  
  if (payload.includes(String.fromCharCode(27)) || payload.includes(String.fromCharCode(29))) {
    encodedPayload = btoa(payload)
    isBase64 = true
  }
  
  // Insert the print job
  const { data: job, error } = await supabase
    .from('print_jobs')
    .insert({
      printer_id: printerId,
      payload: encodedPayload,
      content_type: contentType,
      order_id: orderId || null,
      receipt_type: receiptType ? (isBase64 ? `${receiptType}:base64` : receiptType) : (isBase64 ? 'base64' : null),
      status: 'QUEUED'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to enqueue print job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to enqueue print job', 
        details: error.message
      },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    success: true,
    jobId: job.id,
    printerId: printerId,
    status: 'QUEUED',
    message: 'Print job enqueued successfully'
  })
}

async function createPrinter(supabase: any, body: any) {
  const { 
    name, 
    type, 
    connection_type, 
    ip_address, 
    port, 
    mac_address,
    cloudprnt_url,
    webprnt_url,
    model,
    vendor,
    auto_print_on_payment,
    auto_print_on_order,
    receipt_template,
    paper_width 
  } = body
  
  if (!name || !type || !connection_type) {
    return NextResponse.json({ 
      error: 'Name, type, and connection type are required' 
    }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('printers')
    .insert({
      name,
      type,
      connection_type,
      ip_address,
      port,
      mac_address,
      cloudprnt_url,
      webprnt_url,
      model,
      vendor,
      auto_print_on_payment: auto_print_on_payment || false,
      auto_print_on_order: auto_print_on_order || false,
      receipt_template,
      paper_width: paper_width || 80,
      active: true
    })
    .select()
    .single()
  
  if (error) {
    console.error('Printer creation error:', error)
    return NextResponse.json({ error: 'Failed to create printer' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function updatePrinter(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('printers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Printer update error:', error)
    return NextResponse.json({ error: 'Failed to update printer' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function deletePrinter(supabase: any, id: string) {
  // Check if printer has pending jobs
  const { data: pendingJobs } = await supabase
    .from('print_jobs')
    .select('id')
    .eq('printer_id', id)
    .eq('status', 'QUEUED')
    .limit(1)
  
  if (pendingJobs && pendingJobs.length > 0) {
    return NextResponse.json({ 
      error: 'Cannot delete printer with pending jobs' 
    }, { status: 400 })
  }
  
  // Soft delete the printer
  const { error } = await supabase
    .from('printers')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Printer deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
