import { authenticate, extractBearerToken } from './authMiddleware.ts'
import { resolveWorkspaceId } from './workspaceContext.ts'
import { createUserScopedClient } from '../supabaseClient.ts'
import { errorToResponse, ForbiddenError } from '../errors.ts'
import { getMyRole } from '../../api/repositories/workspace.repository.ts'
import type { Handler, WorkspaceHandler, WorkspaceRequestContext } from './requestContext.ts'

/**
 * JWT-verified + workspace-scoped -- used by Contacts and every future business-data module.
 * Resolves the caller's role via a user-scoped client, so RLS applies exactly as it would for
 * any other read/write this request goes on to make (see docs/architecture.md §2).
 */
export function withWorkspaceHttp(handler: WorkspaceHandler): Handler {
  return async (req, args) => {
    try {
      const authCtx = await authenticate(req)
      const workspaceId = resolveWorkspaceId(req)
      const accessToken = extractBearerToken(req)
      const supabase = createUserScopedClient(accessToken)

      const workspaceRole = await getMyRole(supabase, workspaceId)
      if (!workspaceRole) throw new ForbiddenError('You are not a member of this workspace')

      const ctx: WorkspaceRequestContext = { ...authCtx, workspaceId, workspaceRole, supabase }
      return await handler(req, { ...args, ctx })
    } catch (err) {
      return errorToResponse(err)
    }
  }
}
