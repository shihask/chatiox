export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'agent'

export interface WorkspaceMembershipDTO {
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
}
