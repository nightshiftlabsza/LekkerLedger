import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
