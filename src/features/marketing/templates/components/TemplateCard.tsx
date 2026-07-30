import { Trash2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useChannelTemplates } from '@/features/marketing/templates/hooks/useChannelTemplates'
import { useDeleteTemplate } from '@/features/marketing/templates/hooks/useDeleteTemplate'
import type { ChannelTemplateDTO, TemplateDTO } from '@/features/marketing/templates/types/template.types'

const statusBadgeVariant: Record<ChannelTemplateDTO['status'], 'default' | 'secondary' | 'destructive'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
}

export function TemplateCard({ template }: { template: TemplateDTO }) {
  const { data: channelTemplates, isLoading } = useChannelTemplates(template.id)
  const deleteTemplate = useDeleteTemplate()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <h3 className="text-[14.5px] font-bold text-foreground">{template.name}</h3>
          {template.purpose && <p className="text-[12px] text-muted-foreground">{template.purpose}</p>}
        </div>
        <button
          type="button"
          onClick={() => void deleteTemplate.mutateAsync(template.id)}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete template"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : channelTemplates && channelTemplates.length > 0 ? (
          <div className="space-y-2">
            {channelTemplates.map((ct) => (
              <div key={ct.id} className="rounded-md border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-label text-[10.5px] font-semibold text-foreground uppercase">
                    {ct.channelType}
                  </span>
                  <Badge variant={statusBadgeVariant[ct.status]} className="text-[10px]">
                    {ct.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{ct.languageCode}</span>
                </div>
                {ct.body && <p className="mt-1.5 text-[12.5px] text-foreground/80">{ct.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not synced with any channel yet -- use "Sync from WhatsApp" once this template is approved
            in Meta Business Manager.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
