import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context/useAuth'
import { WorkspaceBadge } from '@/components/layout/WorkspaceBadge'

export function Topbar() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    // Navigate away before flipping auth state -- otherwise ProtectedRoute reacts to the
    // unauthenticated state first and redirects with state: { from: <current page> }, which
    // races this navigate() and can send the next login back to the page we just left instead
    // of the dashboard.
    void navigate('/login', { replace: true })
    await auth.logout()
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <WorkspaceBadge />
      <div className="flex items-center gap-3">
        {auth.status === 'authenticated' && (
          <span className="text-sm text-muted-foreground">{auth.user.email}</span>
        )}
        <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
          Log out
        </Button>
      </div>
    </header>
  )
}
