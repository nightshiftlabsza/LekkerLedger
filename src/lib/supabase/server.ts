import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRequiredEnvValue } from '../env'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
