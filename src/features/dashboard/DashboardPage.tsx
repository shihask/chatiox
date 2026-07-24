import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useContacts } from '@/features/crm/contacts/hooks/useContacts'

// Deliberately minimal -- explicitly not a charts/analytics build. Its forward-looking growth path
// (KPI cards: New Leads, Today's Follow-ups, Open Tasks, Messages Today, Campaigns Running) is
// captured in docs/modules/analytics/analytics.md once Tasks/Communication/Marketing exist.
export function DashboardPage() {
  const auth = useAuth()
  const { data, isLoading } = useContacts({ page: 1, pageSize: 1 })

  const workspaceName = auth.status === 'authenticated' ? auth.workspace.name : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to {workspaceName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s a quick look at your workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-semibold">{data?.meta.total ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
