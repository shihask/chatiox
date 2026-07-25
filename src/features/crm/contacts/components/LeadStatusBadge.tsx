import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeadStatusDTO } from '@/features/crm/contacts/types/contact.types'

export function LeadStatusBadge({ status }: { status: LeadStatusDTO | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">No status</span>

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-label text-[10px] font-semibold tracking-wide uppercase',
        status.isWon && 'border-success/40 bg-success/10 text-success',
        status.isLost && 'border-destructive/40 bg-destructive/10 text-destructive',
        !status.isWon && !status.isLost && 'border-primary/30 bg-primary/5 text-primary',
      )}
    >
      {status.name}
    </Badge>
  )
}
