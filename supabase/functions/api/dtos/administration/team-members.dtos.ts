import type { WorkspaceRole } from '../../../_shared/http/requestContext.ts'

export interface TeamMemberDTO {
  userId: string
  email: string
  role: WorkspaceRole
  joinedAt: string
}

export interface TeamInviteDTO {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  status: 'pending' | 'accepted'
  token: string
  invitedBy: string | null
  createdAt: string
  expiresAt: string
}

export interface InvitePreviewDTO {
  workspaceName: string
  email: string
  role: WorkspaceRole
}
