import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/useAuth'
import type { WorkspaceRole } from '@/features/auth/types/auth.types'

/** Used under ProtectedRoute, so auth.status is always "authenticated" by the time this renders. */
export function RoleGuard({ allow }: { allow: WorkspaceRole[] }) {
  const auth = useAuth()
  if (auth.status !== 'authenticated') return null
  if (!allow.includes(auth.role)) return <Navigate to="/" replace />
  return <Outlet />
}
