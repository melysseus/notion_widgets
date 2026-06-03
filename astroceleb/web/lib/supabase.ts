import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton — safe for server-only read queries.
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY are required.',
    )
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },  // API routes are stateless
  })
  return _client
}
