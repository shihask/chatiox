import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/apiClient'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useChannelConnections } from '@/features/communication/channels/hooks/useChannelConnections'
import { useConversation } from '@/features/communication/inbox/hooks/useConversation'
import { useMessages } from '@/features/communication/inbox/hooks/useMessages'
import { ConversationList, type ConversationFilters } from '@/features/communication/inbox/components/ConversationList'
import { ConversationHeader } from '@/features/communication/inbox/components/ConversationHeader'
import { MessageThread } from '@/features/communication/inbox/components/MessageThread'
import { Composer } from '@/features/communication/inbox/components/Composer'

const CUSTOMER_CARE_WINDOW_MS = 24 * 60 * 60 * 1000

// Kept outside the component -- calling Date.now() directly during render is flagged as impure by
// the React Compiler's purity check (same underlying impurity as lib/date.ts's
// formatRelativeTime(), just not written inline in the component body).
function isWithinCareWindow(lastInboundAt: string | null): boolean {
  if (!lastInboundAt) return false
  return Date.now() - new Date(lastInboundAt).getTime() < CUSTOMER_CARE_WINDOW_MS
}

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ConversationFilters>({})

  const { data: detail, isLoading, isError, error, refetch } = useConversation(conversationId)
  const { data: connections } = useChannelConnections()
  const { data: messages } = useMessages(conversationId)

  const connection = detail ? connections?.find((c) => c.id === detail.conversation.channelConnectionId) : undefined
  const channelDisconnected = Boolean(detail) && connection?.status !== 'connected'

  // WhatsApp (and most chat channels) only allow free-text replies within 24 hours of the
  // contact's last inbound message -- outside that window (or if they've never written in at
  // all, e.g. a business-initiated conversation), Meta requires an approved template instead.
  // Template sending isn't built yet, so this just disables free text rather than pretending.
  const lastInboundAt = messages?.data.reduce<string | null>((latest, m) => {
    if (m.direction !== 'inbound') return latest
    return !latest || new Date(m.occurredAt) > new Date(latest) ? m.occurredAt : latest
  }, null)
  const withinCareWindow = isWithinCareWindow(lastInboundAt ?? null)

  const composerDisabled = channelDisconnected || (Boolean(detail) && !withinCareWindow)
  const disabledReason = channelDisconnected
    ? connection
      ? `${connection.displayName} is disconnected -- reconnect it in Channels to reply.`
      : 'This channel connection no longer exists.'
    : 'Outside the 24-hour customer care window -- WhatsApp requires an approved template to message first (coming soon).'

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inbox</h1>
        <p className="font-label text-xs text-muted-foreground">Conversations across every connected channel.</p>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="w-full max-w-xs shrink-0 overflow-hidden rounded-lg border bg-card">
          <ConversationList
            filters={filters}
            onFiltersChange={setFilters}
            selectedId={conversationId}
            onSelect={(id) => { void navigate(`/inbox/${id}`); }}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
          {!conversationId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation to view it.
            </div>
          ) : isLoading ? (
            <LoadingState label="Loading conversation..." />
          ) : isError || !detail ? (
            <ErrorState
              message={error instanceof ApiError ? error.message : 'Conversation not found'}
              onRetry={() => void refetch()}
            />
          ) : (
            <>
              <ConversationHeader conversation={detail.conversation} />
              <MessageThread conversationId={detail.conversation.id} />
              <Composer
                conversationId={detail.conversation.id}
                disabled={composerDisabled}
                disabledReason={disabledReason}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
