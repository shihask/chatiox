import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/api/apiClient'
import { useMessages } from '@/features/communication/inbox/hooks/useMessages'
import { MessageBubble } from '@/features/communication/inbox/components/MessageBubble'

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { data, isLoading, isError, error, refetch } = useMessages(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)

  // API returns newest-first; reverse for standard oldest-at-top chat order.
  const messages = data ? [...data.data].reverse() : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="ml-auto h-10 w-2/5" />
        <Skeleton className="h-10 w-2/5" />
        <Skeleton className="ml-auto h-10 w-1/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'Failed to load messages'}
        onRetry={() => void refetch()}
      />
    )
  }

  if (messages.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">No messages in this conversation yet.</p>
  }

  return (
    <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
