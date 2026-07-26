import { createContext } from 'react'
import type {
  LoginRequestDTO,
  SessionMembershipDTO,
  SignupRequestDTO,
  WorkspaceRole,
} from '@/features/auth/types/auth.types'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthWorkspace {
  id: string
  name: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | {
      status: 'authenticated'
      user: AuthUser
      workspace: AuthWorkspace
      role: WorkspaceRole
      memberships: SessionMembershipDTO[]
    }

export type AuthContextValue = AuthState & {
  login: (input: LoginRequestDTO) => Promise<void>
  signup: (input: SignupRequestDTO) => Promise<void>
  logout: () => Promise<void>
  switchWorkspace: (workspaceId: string) => void
  renameCurrentWorkspace: (name: string) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
