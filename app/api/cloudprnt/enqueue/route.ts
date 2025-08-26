import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flags } from '@/src/config/flags'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/cloudprnt/enqueue
 * 
 * Admin/internal endpoint to enqueue print jobs for CloudPRNT printers.
 * Used by the application to send jobs to printers.
 */
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!flags.printerCloudPRNTV1) {
    return NextResponse.json(
      { error: 'CloudPRNT feature not enabled' },
      { status: 404 }
    )
  }

  try {
    console.log('📍 CloudPRNT enqueue - starting request processing')
    
    const body = await request.json()
    const { printerId, payload, contentType = 'text/plain', orderId, receiptType } = body

    console.log('📍 Request body parsed:', { printerId, payloadLength: payload?.length, contentType })

    // Validation
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

    console.log(`📤 Enqueuing job for printer ${printerId}`)

    // Test database connection first
    console.log('📍 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('print_jobs')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection test failed:', testError)
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: testError.message,
          hint: 'Make sure the print_jobs table exists and you have the correct permissions'
        },
        { status: 500 }
      )
    }

    console.log('✅ Database connection successful')

    // Encode payload as Base64 if it contains ESC/POS commands to avoid Unicode issues
    let encodedPayload = payload
    let isBase64 = false
    
    // Check if payload contains ESC/POS control characters
    if (payload.includes(String.fromCharCode(27)) || payload.includes(String.fromCharCode(29))) {
      console.log('🔧 Encoding ESC/POS payload as Base64...')
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
        receipt_type: receiptType || null,
        status: 'QUEUED',
        // Store encoding info in a metadata field if available, or use receipt_type
        receipt_type: receiptType ? (isBase64 ? `${receiptType}:base64` : receiptType) : (isBase64 ? 'base64' : null)
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to enqueue print job:', error)
      return NextResponse.json(
        { 
          error: 'Failed to enqueue print job', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log(`✅ Job ${job.id} enqueued for printer ${printerId}`)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      printerId: printerId,
      status: 'QUEUED',
      message: 'Print job enqueued successfully'
    })

  } catch (error) {
    console.error('❌ Enqueue error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack') : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cloudprnt/enqueue
 * 
 * Get print job queue status (for debugging/monitoring)
 */
export async function GET(request: NextRequest) {
  // Feature flag check
  if (!flags.printerCloudPRNTV1) {
    return NextResponse.json(
      { error: 'CloudPRNT feature not enabled' },
      { status: 404 }
    )
  }

  try {
    const url = new URL(request.url)
    const printerId = url.searchParams.get('printerId')

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
      console.error('❌ Failed to fetch print jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch print jobs' },
        { status: 500 }
      )
    }

    // Get summary stats
    const { data: stats, error: statsError } = await supabase
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

  } catch (error) {
    console.error('❌ Queue status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
