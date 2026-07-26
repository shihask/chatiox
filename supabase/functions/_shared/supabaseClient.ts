import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

/** Anon-key client, no user context -- used for auth operations (getUser, signInWithPassword). */
export function createAnonClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * User-scoped client: forwards the caller's JWT so RLS applies as that user.
 * This is what makes RLS the real enforcement mechanism for normal reads/writes (see docs/architecture.md).
 */
export function createUserScopedClient(accessToken: string): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Service-role client: bypasses RLS entirely. For signup (creating auth.users), invite
 * acceptance/preview, and resolving member emails via the Admin API (auth.users isn't exposed
 * through PostgREST). */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
