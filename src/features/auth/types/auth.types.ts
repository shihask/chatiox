// Mirrors supabase/functions/api/dtos/auth.dtos.ts -- keep in sync.
export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'agent'

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

export interface SignupRequestDTO {
  email: string
  password: string
  companyName: string
}

export interface LoginRequestDTO {
  email: string
  password: string
}
