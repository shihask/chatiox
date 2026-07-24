// Mirrors docs/modules/administration/team-members.md -- not implemented yet, no backend route exists.
export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'agent'

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
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  invitedBy: string
  createdAt: string
}
