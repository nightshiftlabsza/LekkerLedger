import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRequiredEnvValue } from '../env'

const E2E_AUTH_BYPASS_COOKIE = 'll-e2e-auth-bypass'
const CANONICAL_ORIGIN = 'https://lekkerledger.co.za'
const CANONICAL_HOST = 'lekkerledger.co.za'
const NOINDEX_HEADER_VALUE = 'noindex, follow'
const NON_INDEXABLE_QUERY_PARAMS = new Set([
  'auth',
  'next',
  'paidLogin',
  'reference',
  'claim',
  'source',
  'activation',
  'sync',
  'freePayslipVerification',
])
const LEGACY_ROUTE_REDIRECTS = new Map<string, string>([
  ['/help/coida', '/resources/guides/coida-and-roe-compliance'],
  ['/help/compliance', '/resources/checklists'],
  ['/rules', '/resources/checklists'],
  ['/uif-calculator', '/calculator'],
  ['/ufiling-errors', '/resources/guides/uif-for-domestic-workers'],
  ['/examples', '/resources/tools/domestic-worker-payslip'],
])
const NOINDEX_ROUTE_PREFIXES = [
  '/billing',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/open-app',
  '/support',
  '/trust',
  '/storage',
  '/legal',
]

const PUBLIC_PREFIXES = [
  '/',
  '/billing',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/legal',
  '/help',
  '/support',
  '/trust',
  '/rules',
  '/resources',
  '/examples',
  '/calculator',
  '/uif-calculator',
  '/ufiling-errors',
  '/onboarding',
  '/open-app',
  '/storage',
  '/api',
  '/_next',
  '/sitemap',
  '/sw',
  '/sw.js',
  '/manifest.webmanifest',
  '/theme-init.js',
  '/ga-init.js',
  '/icon.svg',
  '/apple-icon.png',
]

function isProtectedRoute(pathname: string): boolean {
  if (pathname === '/') return false
  return !PUBLIC_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(prefix + '/'))
  )
}

export function getLegacyRedirectPath(pathname: string): string | null {
  return LEGACY_ROUTE_REDIRECTS.get(pathname) ?? null
}

export function resolveCanonicalRedirect(requestUrl: URL): URL | null {
  const legacyPath = getLegacyRedirectPath(requestUrl.pathname)
  const needsCanonicalHost =
    requestUrl.protocol !== 'https:' || requestUrl.hostname !== CANONICAL_HOST

  if (!legacyPath && !needsCanonicalHost) {
    return null
  }

  const redirectUrl = new URL(CANONICAL_ORIGIN)
  redirectUrl.pathname = legacyPath ?? requestUrl.pathname
  redirectUrl.search = requestUrl.search

  return redirectUrl
}

export function buildProtectedRouteLoginRedirect(requestUrl: URL): URL {
  const loginUrl = new URL('/login', requestUrl.origin)

  const nextPath = `${requestUrl.pathname}${requestUrl.search}`
  if (nextPath && nextPath !== '/' && nextPath !== '/login') {
    loginUrl.searchParams.set('next', nextPath)
  }

  return loginUrl
}

export function shouldApplyNoIndex(pathname: string, searchParams: URLSearchParams): boolean {
  if (isProtectedRoute(pathname)) {
    return true
  }

  if (NOINDEX_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) {
    return true
  }

  for (const key of searchParams.keys()) {
    if (NON_INDEXABLE_QUERY_PARAMS.has(key)) {
      return true
    }
  }

  return false
}

function applyNoIndexHeader(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', NOINDEX_HEADER_VALUE)
  return response
}

function hasE2EAuthBypass(request: NextRequest): boolean {
  if (process.env.E2E_BYPASS_AUTH !== '1') {
    return false
  }

  return request.cookies.get(E2E_AUTH_BYPASS_COOKIE)?.value === '1'
}

export async function updateSession(request: NextRequest) {
  const canonicalRedirectUrl = resolveCanonicalRedirect(request.nextUrl)
  if (canonicalRedirectUrl) {
    return NextResponse.redirect(canonicalRedirectUrl, 308)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })
  const supabaseUrl = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (isProtectedRoute(request.nextUrl.pathname) && hasE2EAuthBypass(request)) {
    if (shouldApplyNoIndex(request.nextUrl.pathname, request.nextUrl.searchParams)) {
      return applyNoIndexHeader(supabaseResponse)
    }
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (isProtectedRoute(request.nextUrl.pathname) && (error || !user)) {
      return applyNoIndexHeader(NextResponse.redirect(buildProtectedRouteLoginRedirect(request.nextUrl), 307))
    }

    if (shouldApplyNoIndex(request.nextUrl.pathname, request.nextUrl.searchParams)) {
      return applyNoIndexHeader(supabaseResponse)
    }

    return supabaseResponse
  } catch {
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return applyNoIndexHeader(NextResponse.redirect(buildProtectedRouteLoginRedirect(request.nextUrl), 307))
    }
    if (shouldApplyNoIndex(request.nextUrl.pathname, request.nextUrl.searchParams)) {
      return applyNoIndexHeader(supabaseResponse)
    }
    return supabaseResponse
  }
}
