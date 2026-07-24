import { ForbiddenError } from './errors.ts'
import type { WorkspaceRequestContext, WorkspaceRole } from './http/requestContext.ts'

export function requireRole(ctx: WorkspaceRequestContext, allowed: WorkspaceRole[]): void {
  if (!allowed.includes(ctx.workspaceRole)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${allowed.join(', ')}`,
    )
  }
}
