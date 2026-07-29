import { useQuery } from '@tanstack/react-query'
import { inboxApi } from '@/api/inboxApi'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'
import type { ListConversationsParams } from '@/features/communication/inbox/types/inbox.types'

// Simple polling stand-in for real-time updates -- Supabase Realtime subscriptions are a later
// roadmap item (see plan doc), not built this pass.
const POLL_INTERVAL_MS = 5000

export function useConversations(params: ListConversationsParams) {
  return useQuery({
    queryKey: conversationsKeys.list(params),
    queryFn: () => inboxApi.listConversations(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: POLL_INTERVAL_MS,
  })
}
