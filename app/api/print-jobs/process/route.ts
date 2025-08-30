// ================================================
// PRINT JOBS PROCESSOR API ROUTE
// ================================================
// This route handles background processing of print jobs
// Can be called by cron jobs, webhooks, or manual triggers

import { NextRequest, NextResponse } from 'next/server'
import { processPrintQueue, processSinglePrintJob, getPrintProcessorStatus } from '@/lib/utils/printJobProcessor'

// GET /api/print-jobs/process - Get processor status
export async function GET(request: NextRequest) {
  try {
    const status = getPrintProcessorStatus()

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting print processor status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get processor status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/print-jobs/process - Process print queue
export async function POST(request: NextRequest) {
  try {
    const { jobId, maxJobs } = await request.json().catch(() => ({}))

    let result

    if (jobId) {
      // Process single job
      console.log(`🔄 Processing single print job: ${jobId}`)
      result = await processSinglePrintJob(jobId)
    } else {
      // Process queue
      console.log('🔄 Processing print job queue')
      await processPrintQueue()
      result = { success: true, message: 'Queue processing completed' }
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error processing print jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process print jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}



