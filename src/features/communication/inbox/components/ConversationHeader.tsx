import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTeamMembers } from '@/features/administration/team-members/hooks/useTeamMembers'
import { useChannelConnections } from '@/features/communication/channels/hooks/useChannelConnections'
import { useUpdateConversation } from '@/features/communication/inbox/hooks/useUpdateConversation'
import { LinkContactDialog } from '@/features/communication/inbox/components/LinkContactDialog'
import { CHANNEL_TYPE_META } from '@/lib/channelTypes'
import { avatarClassFor } from '@/lib/avatarColor'
import type { ConversationDTO } from '@/features/communication/inbox/types/inbox.types'

const UNASSIGNED_VALUE = 'unassigned'

export function ConversationHeader({ conversation }: { conversation: ConversationDTO }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const { data: teamMembers } = useTeamMembers()
  const { data: connections } = useChannelConnections()
  const updateConversation = useUpdateConversation()

  const connection = connections?.find((c) => c.id === conversation.channelConnectionId)
  const Icon = CHANNEL_TYPE_META[conversation.channelType].icon
  const displayName = conversation.contact
    ? `${conversation.contact.firstName} ${conversation.contact.lastName ?? ''}`.trim()
    : conversation.channelIdentityValue
  const initials = conversation.contact
    ? `${conversation.contact.firstName.slice(0, 1)}${conversation.contact.lastName?.slice(0, 1) ?? ''}`
    : conversation.channelIdentityValue.slice(0, 2)

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold uppercase ${avatarClassFor(conversation.id)}`}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {conversation.contact ? (
              <Link to={`/contacts/${conversation.contact.id}`} className="truncate text-[14px] font-bold text-foreground hover:underline">
                {displayName}
              </Link>
            ) : (
              <span className="truncate text-[14px] font-bold text-foreground">{displayName}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Icon className="h-3 w-3" />
            <span>{connection?.displayName ?? conversation.channelType}</span>
            {!conversation.contact && (
              <button type="button" onClick={() => { setLinkDialogOpen(true); }} className="font-semibold text-primary hover:underline">
                Link contact
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={conversation.status}
          onValueChange={(value) => {
            if (!value) return
            void updateConversation.mutateAsync({ id: conversation.id, input: { status: value } })
          }}
        >
          <SelectTrigger className="h-8 w-[110px] text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={conversation.assignedToUserId ?? UNASSIGNED_VALUE}
          onValueChange={(value) => {
            void updateConversation.mutateAsync({
              id: conversation.id,
              input: { assignedToUserId: value === UNASSIGNED_VALUE ? null : value },
            })
          }}
        >
          <SelectTrigger className="h-8 w-[160px] text-[12.5px]">
            <SelectValue placeholder="Assign to...">
              {(value: string) =>
                value === UNASSIGNED_VALUE
                  ? 'Unassigned'
                  : (teamMembers?.find((m) => m.userId === value)?.email ?? 'Assign to...')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {teamMembers?.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {connection && connection.status !== 'connected' && (
          <Badge variant="destructive" className="text-[10.5px]">
            Channel disconnected
          </Badge>
        )}
      </div>

      <LinkContactDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} conversationId={conversation.id} />
    </div>
  )
}
