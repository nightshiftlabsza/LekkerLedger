import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRequiredEnvValue } from '../env'

const E2E_AUTH_BYPASS_COOKIE = 'll-e2e-auth-bypass'

const PUBLIC_PREFIXES = [
  '/',
  '/billing',
  '/login',
  '/signup',
  '/forgot-password',
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

export function buildProtectedRouteLoginRedirect(requestUrl: URL): URL {
  const loginUrl = new URL('/', requestUrl.origin)
  loginUrl.searchParams.set('auth', 'login')

  const nextPath = `${requestUrl.pathname}${requestUrl.search}`
  if (nextPath && nextPath !== '/') {
    loginUrl.searchParams.set('next', nextPath)
  }

  return loginUrl
}

function hasE2EAuthBypass(request: NextRequest): boolean {
  if (process.env.E2E_BYPASS_AUTH !== '1') {
    return false
  }

  return request.cookies.get(E2E_AUTH_BYPASS_COOKIE)?.value === '1'
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const supabaseUrl = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (isProtectedRoute(request.nextUrl.pathname) && hasE2EAuthBypass(request)) {
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
      return NextResponse.redirect(buildProtectedRouteLoginRedirect(request.nextUrl))
    }

    return supabaseResponse
  } catch {
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(buildProtectedRouteLoginRedirect(request.nextUrl))
    }
    return supabaseResponse
  }
}
