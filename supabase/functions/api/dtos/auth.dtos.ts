import type { WorkspaceRole } from '../../_shared/http/requestContext.ts'

export interface SessionMembershipDTO {
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
}

export interface SessionDTO {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: { id: string; email: string }
  memberships: SessionMembershipDTO[]
}

export interface MeDTO {
  user: { id: string; email: string }
  memberships: SessionMembershipDTO[]
}
