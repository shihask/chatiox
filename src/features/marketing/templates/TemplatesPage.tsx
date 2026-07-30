import { useState } from 'react'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/api/apiClient'
import { useChannelConnections } from '@/features/communication/channels/hooks/useChannelConnections'
import { useTemplates } from '@/features/marketing/templates/hooks/useTemplates'
import { useSyncChannelTemplates } from '@/features/marketing/templates/hooks/useSyncChannelTemplates'
import { CreateTemplateDialog } from '@/features/marketing/templates/components/CreateTemplateDialog'
import { TemplateCard } from '@/features/marketing/templates/components/TemplateCard'

export function TemplatesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: templates, isLoading, isError, error, refetch } = useTemplates()
  const { data: connections } = useChannelConnections()
  const syncChannelTemplates = useSyncChannelTemplates()

  const whatsapp = connections?.find((c) => c.channelType === 'whatsapp' && c.status === 'connected')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
          <p className="font-label text-xs text-muted-foreground">
            Reusable message templates -- required to message a contact outside WhatsApp's 24-hour window.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {whatsapp && (
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={syncChannelTemplates.isPending}
              onClick={() => void syncChannelTemplates.mutateAsync(whatsapp.id)}
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              {syncChannelTemplates.isPending ? 'Syncing...' : 'Sync from WhatsApp'}
            </Button>
          )}
          <Button onClick={() => { setCreateOpen(true); }} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Failed to load templates'}
          onRetry={() => void refetch()}
        />
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No templates yet.</p>
          {whatsapp ? (
            <p className="max-w-sm text-xs text-muted-foreground">
              Approve a template in Meta Business Manager, then click "Sync from WhatsApp" -- it creates
              the matching template here automatically.
            </p>
          ) : (
            <p className="max-w-sm text-xs text-muted-foreground">
              Connect a WhatsApp channel first, or create a template manually below.
            </p>
          )}
        </div>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
