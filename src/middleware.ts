import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'dm_session_token'

const PROTECTED_PATHS = ['/campaigns']
const AUTH_PATHS = ['/auth/login', '/auth/signup']

// ---------------------------------------------------------------------------
// In-memory rate limiter for auth endpoints (login / signup)
// Works correctly for single-instance deployments (local dev, single server).
// For multi-instance deployments (e.g. Vercel serverless / Edge) replace the
// Map with an external atomic store such as Upstash Redis + @upstash/ratelimit.
// ---------------------------------------------------------------------------
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10        // max attempts
const RATE_LIMIT_WINDOW_MS = 60_000 // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false // not limited
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ---------------------------------------------------------------------------
// Security response headers applied to every response
// ---------------------------------------------------------------------------
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isAuthenticated = Boolean(sessionToken)

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p))

  // Rate-limit POST requests to auth pages (login / signup attempts)
  if (request.method === 'POST' && isAuthPage) {
    const ip = getClientIp(request)
    if (checkRateLimit(ip)) {
      return applySecurityHeaders(
        new NextResponse('Too many requests. Please try again later.', {
          status: 429,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
    }
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  if (isAuthPage && isAuthenticated) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/campaigns/:path*', '/auth/login', '/auth/signup'],
}
