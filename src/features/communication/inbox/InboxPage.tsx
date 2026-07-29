import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/apiClient'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useChannelConnections } from '@/features/communication/channels/hooks/useChannelConnections'
import { useConversation } from '@/features/communication/inbox/hooks/useConversation'
import { ConversationList, type ConversationFilters } from '@/features/communication/inbox/components/ConversationList'
import { ConversationHeader } from '@/features/communication/inbox/components/ConversationHeader'
import { MessageThread } from '@/features/communication/inbox/components/MessageThread'
import { Composer } from '@/features/communication/inbox/components/Composer'

export function InboxPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ConversationFilters>({})

  const { data: detail, isLoading, isError, error, refetch } = useConversation(conversationId)
  const { data: connections } = useChannelConnections()

  const connection = detail ? connections?.find((c) => c.id === detail.conversation.channelConnectionId) : undefined
  const composerDisabled = Boolean(detail) && connection?.status !== 'connected'

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
                disabledReason={
                  connection
                    ? `${connection.displayName} is disconnected -- reconnect it in Channels to reply.`
                    : 'This channel connection no longer exists.'
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
