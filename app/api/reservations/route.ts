// Reservation API Route v1.0
// Flag-gated reservation management endpoint

import { NextRequest, NextResponse } from 'next/server'
import { flags } from '@/src/config/flags'

// Feature flag check - export functions conditionally
export async function GET(request: NextRequest) {
  if (!flags.reservationsV1) {
    return new NextResponse('Reservations feature not enabled', { status: 404 })
  }
  
  // Import reservation handler only when flag is enabled
  const { getReservationsHandler } = await import('./handlers')
  return getReservationsHandler(request)
}

export async function POST(request: NextRequest) {
  if (!flags.reservationsV1) {
    return new NextResponse('Reservations feature not enabled', { status: 404 })
  }
  
  // Import reservation handler only when flag is enabled
  const { createReservationHandler } = await import('./handlers')
  return createReservationHandler(request)
}

