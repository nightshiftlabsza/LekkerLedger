import { NextResponse, type NextRequest } from 'next/server'
import { getCanonicalAppOrigin, getRequestCurrentOrigin } from '@/lib/app-origin'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const requestOrigin = getRequestCurrentOrigin(request)
  const canonicalOrigin = getCanonicalAppOrigin(requestOrigin)

  if (canonicalOrigin && canonicalOrigin !== requestOrigin) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonicalOrigin), 308)
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
