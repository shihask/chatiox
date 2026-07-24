import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeadStatusDTO } from '@/features/crm/contacts/types/contact.types'

export function LeadStatusBadge({ status }: { status: LeadStatusDTO | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">No status</span>

  return (
    <Badge
      variant="outline"
      className={cn(
        status.isWon && 'border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
        status.isLost && 'border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-400',
      )}
    >
      {status.name}
    </Badge>
  )
}
