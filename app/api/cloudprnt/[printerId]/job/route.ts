import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flags } from '@/src/config/flags'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/cloudprnt/[printerId]/job
 * 
 * CloudPRNT poll endpoint - printers POST to check for jobs and report status.
 * According to Star CloudPRNT protocol, this should respond with job availability info,
 * NOT the actual job content.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ printerId: string }> }
) {
  // Feature flag check
  if (!flags.printerCloudPRNTV1) {
    return new NextResponse('CloudPRNT feature not enabled', { status: 404 })
  }

  try {
    const { printerId } = await params
    const body = await request.json()

    console.log(`📡 CloudPRNT POST from printer: ${printerId}`)
    console.log(`📞 Printer status:`, {
      status: body.status,
      mac: body.printerMAC,
      statusCode: body.statusCode
    })

    // Check for queued jobs
    const { data: job, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('printer_id', printerId)
      .eq('status', 'QUEUED')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Database error fetching print job:', error)
      return NextResponse.json({ jobReady: false }, { status: 500 })
    }

    // No jobs available
    if (!job) {
      console.log(`📭 No jobs for printer ${printerId}`)
      return NextResponse.json({ 
        jobReady: false 
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // Job available - respond with job ready and supported media types
    console.log(`🎯 Job ${job.id} available for printer ${printerId}`)
    
    return NextResponse.json({
      jobReady: true,
      mediaTypes: [job.content_type || 'text/plain'],
      jobToken: job.id // Include job ID for GET request
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ CloudPRNT POST error:', error)
    return NextResponse.json({ jobReady: false }, { status: 500 })
  }
}

/**
 * GET /api/cloudprnt/[printerId]/job?type=text/plain&mac=...
 * 
 * CloudPRNT job retrieval endpoint - printers GET the actual job content
 * after receiving jobReady: true from POST.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ printerId: string }> }
) {
  // Feature flag check
  if (!flags.printerCloudPRNTV1) {
    return new NextResponse('CloudPRNT feature not enabled', { status: 404 })
  }

  try {
    const { printerId } = await params
    const { searchParams } = new URL(request.url)
    const requestedType = searchParams.get('type') || 'text/plain'
    const printerMAC = searchParams.get('mac')

    console.log(`📥 CloudPRNT GET from printer: ${printerId}`)
    console.log(`📄 Requested type: ${requestedType}, MAC: ${printerMAC}`)

    // Find the oldest queued job for this printer
    const { data: job, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('printer_id', printerId)
      .eq('status', 'QUEUED')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Database error fetching print job:', error)
      return new NextResponse('Database error', { status: 500 })
    }

    // No jobs available
    if (!job) {
      console.log(`📭 No jobs for GET request from printer ${printerId}`)
      return new NextResponse('No jobs available', { status: 204 })
    }

    // Mark job as delivered
    const { error: updateError } = await supabase
      .from('print_jobs')
      .update({
        status: 'DELIVERED',
        delivered_at: new Date().toISOString()
      })
      .eq('id', job.id)

    if (updateError) {
      console.error('❌ Failed to mark job as delivered:', updateError)
      return new NextResponse('Failed to update job status', { status: 500 })
    }

    console.log(`✅ Delivering job ${job.id} content to printer ${printerId}`)

    // Decode Base64 payload if it was encoded
    let actualPayload = job.payload
    if (job.receipt_type && job.receipt_type.includes(':base64')) {
      console.log('🔧 Decoding Base64 payload...')
      try {
        actualPayload = atob(job.payload)
      } catch (error) {
        console.error('❌ Failed to decode Base64 payload:', error)
        actualPayload = job.payload // Fallback to original
      }
    }

    // Return the actual job content
    return new NextResponse(actualPayload, {
      status: 200,
      headers: {
        'Content-Type': requestedType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ CloudPRNT GET error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}