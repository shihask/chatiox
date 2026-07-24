import { Badge } from '@/components/ui/badge'
import { CHANNEL_TYPE_META } from '@/lib/channelTypes'
import type { ContactChannelDTO } from '@/features/crm/contacts/types/contact.types'

export function ContactChannelBadges({ channels }: { channels: ContactChannelDTO[] }) {
  if (channels.length === 0) return <span className="text-sm text-muted-foreground">No channels</span>

  const visible = channels.slice(0, 3)
  const overflow = channels.length - visible.length

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((channel) => {
        const meta = CHANNEL_TYPE_META[channel.channelType]
        const Icon = meta.icon
        return (
          <Badge key={channel.id} variant={channel.isPrimary ? 'default' : 'secondary'} className="gap-1">
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span className="max-w-[120px] truncate">{channel.value}</span>
          </Badge>
        )
      })}
      {overflow > 0 && <Badge variant="outline">+{overflow}</Badge>}
    </div>
  )
}
