import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/features/crm/tasks/types/task.types'

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-label text-[10px] font-semibold tracking-wide uppercase',
        status === 'completed' && 'border-success/40 bg-success/10 text-success',
        status === 'cancelled' && 'border-muted-foreground/30 bg-muted text-muted-foreground',
        status === 'open' && 'border-primary/30 bg-primary/5 text-primary',
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}
