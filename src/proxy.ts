import { NextResponse, type NextRequest } from 'next/server'
import {
  getCanonicalAppOrigin,
  getConfiguredAppOrigin,
  getRequestCurrentOrigin,
  isLocalAppOrigin,
} from '@/lib/app-origin'
import { updateSession } from '@/lib/supabase/middleware'

const LEGACY_ROUTE_REDIRECTS = new Map<string, string>([
  ['/help/coida', '/resources/guides/coida-and-roe-compliance'],
  ['/help/compliance', '/resources/checklists'],
  ['/rules', '/resources/checklists'],
])

function getCanonicalRedirectUrl(request: NextRequest): URL | null {
  const requestOrigin = getRequestCurrentOrigin(request)
  const isLocalRequest =
    isLocalAppOrigin(requestOrigin)
    || process.env.NODE_ENV !== "production"
    || process.env.E2E_BYPASS_AUTH === "1"

  if (isLocalRequest) {
    return null
  }

  const redirectOrigin = getConfiguredAppOrigin() || getCanonicalAppOrigin(requestOrigin)
  const legacyPath = LEGACY_ROUTE_REDIRECTS.get(request.nextUrl.pathname) ?? null
  const needsCanonicalOrigin = !!redirectOrigin && redirectOrigin !== requestOrigin

  if (!legacyPath && !needsCanonicalOrigin) {
    return null
  }

  const redirectUrl = new URL(redirectOrigin || requestOrigin)
  redirectUrl.pathname = legacyPath ?? request.nextUrl.pathname
  redirectUrl.search = request.nextUrl.search

  return redirectUrl
}

export async function proxy(request: NextRequest) {
  const canonicalRedirectUrl = getCanonicalRedirectUrl(request)
  if (canonicalRedirectUrl) {
    return NextResponse.redirect(canonicalRedirectUrl, 308)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - __mockup (proxied to mockup sandbox dev server)
     * - static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|__mockup|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|webmanifest|ico|txt|xml)$).*)",
  ],
}
