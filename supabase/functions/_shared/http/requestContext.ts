import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'agent'

export interface AuthenticatedRequestContext {
  userId: string
  email: string
}

export interface WorkspaceRequestContext extends AuthenticatedRequestContext {
  workspaceId: string
  workspaceRole: WorkspaceRole
  /** User-scoped client, already built from this request's bearer token -- reuse it rather than
   * extracting the token and instantiating a new client per handler. */
  supabase: SupabaseClient
}

export type RouteParams = Record<string, string | undefined>

/** The uniform shape router.ts calls -- every withXHttp wrapper returns this. */
export type Handler = (req: Request, args: { params: RouteParams }) => Promise<Response>

export type PublicHandler = (req: Request, args: { params: RouteParams }) => Promise<Response>

/** Structurally identical to PublicHandler today -- no injected ctx, since resolution (signature
 * verification, tenant lookup) is entirely provider-specific per request. Kept as its own type so
 * webhook-specific error handling can diverge later without touching unrelated public routes. */
export type WebhookHandler = (req: Request, args: { params: RouteParams }) => Promise<Response>

export type AuthenticatedHandler = (
  req: Request,
  args: { params: RouteParams; ctx: AuthenticatedRequestContext },
) => Promise<Response>

export type WorkspaceHandler = (
  req: Request,
  args: { params: RouteParams; ctx: WorkspaceRequestContext },
) => Promise<Response>
