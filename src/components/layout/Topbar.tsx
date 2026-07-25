import { useState } from 'react'
import { MenuIcon, SearchIcon, BellIcon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/context/useAuth'
import { WorkspaceBadge } from '@/components/layout/WorkspaceBadge'
import { useCreateContactDialog } from '@/features/crm/contacts/context/useCreateContactDialog'

function initialsFor(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function Topbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void
  onSearchClick: () => void
}) {
  const auth = useAuth()
  const navigate = useNavigate()
  const createContactDialog = useCreateContactDialog()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  async function handleLogout() {
    // Navigate away before flipping auth state -- otherwise ProtectedRoute reacts to the
    // unauthenticated state first and redirects with state: { from: <current page> }, which
    // races this navigate() and can send the next login back to the page we just left instead
    // of the dashboard.
    void navigate('/login', { replace: true })
    await auth.logout()
  }

  return (
    <header className="flex h-[58px] shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-4 sm:px-4">
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

      <button
        type="button"
        onClick={onSearchClick}
        className="hidden max-w-md flex-1 items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-ring/50 sm:flex"
      >
        <SearchIcon className="h-[15px] w-[15px] shrink-0" />
        <span className="flex-1 text-left">Search contacts...</span>
        <span className="font-label rounded border px-1.5 py-0.5 text-[10px]">&#8984;K</span>
      </button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSearchClick}
        className="shrink-0 sm:hidden"
        aria-label="Search"
      >
        <SearchIcon className="h-[18px] w-[18px]" />
      </Button>

      <div className="flex-1" />

      <Button onClick={createContactDialog.open} size="sm" className="hidden gap-1.5 sm:inline-flex">
        <PlusIcon className="h-4 w-4" />
        Add Contact
      </Button>
      <Button
        onClick={createContactDialog.open}
        size="icon-sm"
        className="shrink-0 sm:hidden"
        aria-label="Add contact"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>

      <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
          <BellIcon className="h-[18px] w-[18px]" />
          <span className="sr-only">Notifications</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      {auth.status === 'authenticated' && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initialsFor(auth.user.email)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {auth.user.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
