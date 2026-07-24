import { MenuIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context/useAuth'
import { WorkspaceBadge } from '@/components/layout/WorkspaceBadge'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
        <WorkspaceBadge />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {auth.status === 'authenticated' && (
          <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
            {auth.user.email}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
          Log out
        </Button>
      </div>
    </header>
  )
}
