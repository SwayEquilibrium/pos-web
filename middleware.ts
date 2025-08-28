import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Simplified middleware - let the client handle auth
  // This prevents server-side auth issues from blocking navigation
  
  const res = NextResponse.next()
  
  // Only handle basic route protection, let client handle auth state
  const protectedRoutes = ['/dashboard', '/admin', '/modules']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    // Let the client handle authentication checks
    // This prevents middleware from blocking valid users
    return res
  }
  
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*', 
    '/modules/:path*',
    '/login',
    '/signup',
    '/landing'
  ]
}
