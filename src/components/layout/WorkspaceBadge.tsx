import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/context/useAuth'

export function WorkspaceBadge() {
  const auth = useAuth()
  if (auth.status !== 'authenticated') return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">{auth.workspace.name}</span>
      <Badge variant="secondary" className="capitalize">
        {auth.role}
      </Badge>
    </div>
  )
}
