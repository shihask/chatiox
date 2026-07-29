import { Badge } from '@/components/ui/badge'
import { CHANNEL_TYPE_META } from '@/lib/channelTypes'
import { avatarClassFor } from '@/lib/avatarColor'
import { formatRelativeTime } from '@/lib/date'
import type { ConversationDTO } from '@/features/communication/inbox/types/inbox.types'

const statusDotClass: Record<ConversationDTO['status'], string> = {
  open: 'bg-emerald-500',
  pending: 'bg-amber-500',
  closed: 'bg-muted-foreground/40',
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationDTO
  isSelected: boolean
  onClick: () => void
}) {
  const Icon = CHANNEL_TYPE_META[conversation.channelType].icon
  const displayName = conversation.contact
    ? `${conversation.contact.firstName} ${conversation.contact.lastName ?? ''}`.trim()
    : conversation.channelIdentityValue
  const initials = conversation.contact
    ? `${conversation.contact.firstName.slice(0, 1)}${conversation.contact.lastName?.slice(0, 1) ?? ''}`
    : conversation.channelIdentityValue.slice(0, 2)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 border-b px-3 py-3 text-left transition-colors hover:bg-muted/60 ${
        isSelected ? 'bg-muted' : ''
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold uppercase ${avatarClassFor(conversation.id)}`}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13.5px] font-semibold text-foreground">{displayName}</span>
          {conversation.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-[12.5px] text-muted-foreground">
            {conversation.lastMessagePreview ?? 'No messages yet'}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass[conversation.status]}`} />
          <span className="font-label text-[10px] text-muted-foreground uppercase">{conversation.status}</span>
          {!conversation.contact && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9.5px]">
              Unassigned
            </Badge>
          )}
          {conversation.unreadCount > 0 && (
            <Badge className="ml-auto h-4.5 px-1.5 text-[10px]">{conversation.unreadCount}</Badge>
          )}
        </div>
      </div>
    </button>
  )
}
