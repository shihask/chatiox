import { Link } from 'react-router-dom'
import { Users2Icon, TrophyIcon, XCircleIcon, UserCheckIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'
import { useLeadStatuses } from '@/features/crm/contacts/hooks/useLeadStatuses'
import { ContactChannelBadges } from '@/features/crm/contacts/components/ContactChannelBadges'
import { LeadStatusBadge } from '@/features/crm/contacts/components/LeadStatusBadge'
import { avatarClassFor } from '@/lib/avatarColor'

function KpiCard({
  label,
  value,
  isLoading,
  icon: Icon,
}: {
  label: string
  value: number
  isLoading: boolean
  icon: typeof Users2Icon
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-5">
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-secondary">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-[12.5px] font-semibold text-muted-foreground">{label}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <p className="text-[26px] font-extrabold tracking-tight text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Deliberately minimal -- explicitly not a charts/analytics build. KPIs are all computed from data
// Phase 1 already models (contacts + lead_statuses' isWon/isLost flags), no fabricated/mock metrics.
// Sections needing unbuilt modules (conversations, follow-ups, activity feed) are left out until
// Communication/Tasks/Timeline exist -- see docs/modules/analytics/analytics.md.
export function DashboardPage() {
  const auth = useAuth()
  const workspaceName = auth.status === 'authenticated' ? auth.workspace.name : ''
  const currentUserId = auth.status === 'authenticated' ? auth.user.id : undefined

  const { data: leadStatuses } = useLeadStatuses()
  const wonStatusId = leadStatuses?.find((s) => s.isWon)?.id
  const lostStatusId = leadStatuses?.find((s) => s.isLost)?.id

  const { data: totalData, isLoading: totalLoading } = useContacts({ page: 1, pageSize: 1 })
  const { data: wonData, isLoading: wonLoading } = useContacts({
    page: 1,
    pageSize: 1,
    leadStatusId: wonStatusId,
  })
  const { data: lostData, isLoading: lostLoading } = useContacts({
    page: 1,
    pageSize: 1,
    leadStatusId: lostStatusId,
  })
  const { data: assignedData, isLoading: assignedLoading } = useContacts({
    page: 1,
    pageSize: 1,
    assignedToUserId: currentUserId,
  })
  const { data: recentData, isLoading: recentLoading } = useContacts({ page: 1, pageSize: 5 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Welcome to {workspaceName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s a quick look at your workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Contacts"
          value={totalData?.meta.total ?? 0}
          isLoading={totalLoading}
          icon={Users2Icon}
        />
        <KpiCard
          label="Won"
          value={wonData?.meta.total ?? 0}
          isLoading={wonLoading || !leadStatuses}
          icon={TrophyIcon}
        />
        <KpiCard
          label="Lost"
          value={lostData?.meta.total ?? 0}
          isLoading={lostLoading || !leadStatuses}
          icon={XCircleIcon}
        />
        <KpiCard
          label="Assigned to Me"
          value={assignedData?.meta.total ?? 0}
          isLoading={assignedLoading}
          icon={UserCheckIcon}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-[14.5px] font-bold text-foreground">Recent contacts</h3>
          <Link to="/contacts" className="text-xs font-semibold text-primary hover:underline">
            View all &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentData && recentData.data.length > 0 ? (
            <div className="divide-y">
              {recentData.data.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/contacts/${contact.id}`}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-accent/60"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold ${avatarClassFor(contact.id)}`}
                  >
                    {contact.firstName.slice(0, 1)}
                    {contact.lastName?.slice(0, 1) ?? ''}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {contact.firstName} {contact.lastName ?? ''}
                    </p>
                    <ContactChannelBadges channels={contact.channels} />
                  </div>
                  <LeadStatusBadge status={contact.leadStatus} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No contacts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
