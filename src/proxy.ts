import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
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
    '/((?!_next/static|_next/image|favicon.ico|__mockup|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|webmanifest|ico|txt|xml)$).*)',
  ],
}
