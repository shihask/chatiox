import { CheckIcon, ChevronDownIcon, Building2Icon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/context/useAuth'

/** Workspace switcher -- real data from auth.memberships (every membership the signed-in user
    actually has), not a mocked list. Most users have exactly one today since there's no invite
    flow yet; the dropdown still lists whatever is real and switches via auth.switchWorkspace. */
export function WorkspaceBadge() {
  const auth = useAuth()
  if (auth.status !== 'authenticated') return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      >
        <Building2Icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
        <span className="truncate font-semibold text-foreground">{auth.workspace.name}</span>
        <Badge variant="secondary" className="hidden shrink-0 capitalize sm:inline-flex">
          {auth.role}
        </Badge>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {auth.memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.workspaceId}
            onClick={() => { auth.switchWorkspace(membership.workspaceId); }}
            className="justify-between"
          >
            <span className="truncate">{membership.workspaceName}</span>
            {membership.workspaceId === auth.workspace.id && (
              <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
