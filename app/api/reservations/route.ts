// Reservation API Route v1.0
// Flag-gated reservation management endpoint

import { NextRequest, NextResponse } from 'next/server'
import { flags } from '@/src/config/flags'

// Only enable if reservationsV1 flag is on
if (!flags.reservationsV1) {
  // Return 404 when flag is disabled
  export async function GET() {
    return new NextResponse('Reservations feature not enabled', { status: 404 })
  }
  
  export async function POST() {
    return new NextResponse('Reservations feature not enabled', { status: 404 })
  }
} else {
  // Import reservation handler only when flag is enabled
  const { createReservationHandler, getReservationsHandler } = await import('@/proposals/api/reservations/handlers.v1')
  
  export async function GET(request: NextRequest) {
    return getReservationsHandler(request)
  }
  
  export async function POST(request: NextRequest) {
    return createReservationHandler(request)
  }
}
