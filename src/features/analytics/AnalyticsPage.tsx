import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLeadsBySource } from '@/features/analytics/hooks/useLeadsBySource'
import { useLeadStatusDistribution } from '@/features/analytics/hooks/useLeadStatusDistribution'
import { cn } from '@/lib/utils'

function BarRow({
  label,
  total,
  max,
  barClassName,
  trailing,
}: {
  label: string
  total: number
  max: number
  barClassName: string
  trailing?: ReactNode
}) {
  const widthPct = max > 0 ? Math.max((total / max) * 100, total > 0 ? 4 : 0) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {trailing}
          <span className="font-label text-muted-foreground">{total}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const { data: leadsBySource, isLoading: sourceLoading } = useLeadsBySource()
  const { data: statusDistribution, isLoading: statusLoading } = useLeadStatusDistribution()

  const activeSources = (leadsBySource ?? [])
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
  const maxSourceTotal = Math.max(...activeSources.map((r) => r.total), 1)
  const maxStatusTotal = Math.max(...(statusDistribution ?? []).map((r) => r.total), 1)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="font-label text-xs text-muted-foreground">
          Lead performance across sources and pipeline stages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-[14.5px] font-bold text-foreground">Leads by Source</h3>
          <p className="text-xs text-muted-foreground">Where your won and lost leads came from.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sourceLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : activeSources.length > 0 ? (
            activeSources.map((row) => (
              <BarRow
                key={row.leadSourceId}
                label={row.leadSourceName}
                total={row.total}
                max={maxSourceTotal}
                barClassName="bg-primary"
                trailing={
                  <span className="font-label text-[10.5px] text-muted-foreground">
                    <span className="text-success">{row.won} won</span>
                    {' · '}
                    <span className="text-destructive">{row.lost} lost</span>
                  </span>
                }
              />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No contacts with a lead source yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-[14.5px] font-bold text-foreground">Lead Status Distribution</h3>
          <p className="text-xs text-muted-foreground">Where contacts sit across your pipeline.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : statusDistribution && statusDistribution.length > 0 ? (
            statusDistribution.map((row) => (
              <BarRow
                key={row.leadStatusId}
                label={row.leadStatusName}
                total={row.total}
                max={maxStatusTotal}
                barClassName={cn(
                  row.isWon && 'bg-success',
                  row.isLost && 'bg-muted-foreground/40',
                  !row.isWon && !row.isLost && 'bg-primary',
                )}
              />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No lead statuses configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
