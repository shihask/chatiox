import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/authApi'
import { tokenStorage } from '@/lib/tokenStorage'
import { AuthContext, type AuthContextValue, type AuthState } from '@/features/auth/context/AuthContext'
import type {
  LoginRequestDTO,
  SessionDTO,
  SessionMembershipDTO,
  SignupRequestDTO,
} from '@/features/auth/types/auth.types'

function stateFromMemberships(
  user: { id: string; email: string },
  memberships: SessionMembershipDTO[],
  preferredId?: string | null,
): AuthState {
  const selected = memberships.find((m) => m.workspaceId === preferredId) ?? memberships[0]
  if (!selected) return { status: 'unauthenticated' }
  return {
    status: 'authenticated',
    user,
    workspace: { id: selected.workspaceId, name: selected.workspaceName },
    role: selected.role,
    memberships,
  }
}

function stateFromSession(session: SessionDTO): AuthState {
  return stateFromMemberships(session.user, session.memberships, tokenStorage.getCurrentWorkspaceId())
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
        const next = stateFromMemberships(me.user, me.memberships, tokenStorage.getCurrentWorkspaceId())
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

  const queryClient = useQueryClient()

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      setState((current) => {
        if (current.status !== 'authenticated') return current
        const membership = current.memberships.find((m) => m.workspaceId === workspaceId)
        if (!membership || membership.workspaceId === current.workspace.id) return current
        tokenStorage.setCurrentWorkspaceId(membership.workspaceId)
        return {
          ...current,
          workspace: { id: membership.workspaceId, name: membership.workspaceName },
          role: membership.role,
        }
      })
      // Every workspace-scoped query is keyed independently of workspace id today, so switching
      // workspaces must drop the old workspace's cached data -- otherwise contacts/lead lists would
      // briefly (or permanently, if not refetched) show the previous workspace's data.
      void queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const renameCurrentWorkspace = useCallback((name: string) => {
    setState((current) => {
      if (current.status !== 'authenticated') return current
      return {
        ...current,
        workspace: { ...current.workspace, name },
        memberships: current.memberships.map((m) =>
          m.workspaceId === current.workspace.id ? { ...m, workspaceName: name } : m,
        ),
      }
    })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    switchWorkspace,
    renameCurrentWorkspace,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
