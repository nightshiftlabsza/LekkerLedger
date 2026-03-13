import { NextResponse } from 'next/server'
import { getRequestAppOrigin } from '@/lib/app-origin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getRequestAppOrigin(request)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const safeNext = next && next.startsWith('/') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_or_expired_link`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    const errorMsg = error.message?.toLowerCase() ?? ''
    if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
      return NextResponse.redirect(`${origin}/login?error=invalid_or_expired_link`)
    }

    return NextResponse.redirect(`${origin}/login?error=code_exchange_failed`)
  } catch {
    return NextResponse.redirect(`${origin}/login?error=code_exchange_failed`)
  }
}
