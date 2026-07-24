import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '@/api/authApi'
import { tokenStorage } from '@/lib/tokenStorage'
import { AuthContext, type AuthContextValue, type AuthState } from '@/features/auth/context/AuthContext'
import type {
  LoginRequestDTO,
  SessionDTO,
  SessionMembershipDTO,
  SignupRequestDTO,
} from '@/features/auth/types/auth.types'

function stateFromSession(session: SessionDTO): AuthState {
  const membership = session.memberships[0]
  if (!membership) return { status: 'unauthenticated' }
  return {
    status: 'authenticated',
    user: session.user,
    workspace: { id: membership.workspaceId, name: membership.workspaceName },
    role: membership.role,
  }
}

function stateFromMemberships(
  user: { id: string; email: string },
  memberships: SessionMembershipDTO[],
): AuthState {
  const preferredId = tokenStorage.getCurrentWorkspaceId()
  const selected = memberships.find((m) => m.workspaceId === preferredId) ?? memberships[0]
  if (!selected) return { status: 'unauthenticated' }
  return {
    status: 'authenticated',
    user,
    workspace: { id: selected.workspaceId, name: selected.workspaceName },
    role: selected.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!tokenStorage.getAccessToken()) {
        setState({ status: 'unauthenticated' })
        return
      }
      try {
        const me = await authApi.me()
        if (cancelled) return
        const next = stateFromMemberships(me.user, me.memberships)
        if (next.status === 'authenticated') tokenStorage.setCurrentWorkspaceId(next.workspace.id)
        setState(next)
      } catch {
        tokenStorage.clear()
        if (!cancelled) setState({ status: 'unauthenticated' })
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginRequestDTO) => {
    const session = await authApi.login(input)
    tokenStorage.setSession(session)
    const next = stateFromSession(session)
    if (next.status === 'authenticated') tokenStorage.setCurrentWorkspaceId(next.workspace.id)
    setState(next)
  }, [])

  const signup = useCallback(async (input: SignupRequestDTO) => {
    const session = await authApi.signup(input)
    tokenStorage.setSession(session)
    const next = stateFromSession(session)
    if (next.status === 'authenticated') tokenStorage.setCurrentWorkspaceId(next.workspace.id)
    setState(next)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStorage.clear()
      setState({ status: 'unauthenticated' })
    }
  }, [])

  const value: AuthContextValue = { ...state, login, signup, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
