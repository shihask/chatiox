import { useQuery } from '@tanstack/react-query'
import { inboxApi } from '@/api/inboxApi'
import { messagesKeys } from '@/features/communication/inbox/hooks/queryKeys'

const POLL_INTERVAL_MS = 5000

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messagesKeys.list(conversationId ?? ''),
    queryFn: () => inboxApi.listMessages(conversationId ?? ''),
    enabled: Boolean(conversationId),
    refetchInterval: POLL_INTERVAL_MS,
  })
}
