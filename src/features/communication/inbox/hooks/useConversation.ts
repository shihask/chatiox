import { useQuery } from '@tanstack/react-query'
import { inboxApi } from '@/api/inboxApi'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'

const POLL_INTERVAL_MS = 5000

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: conversationsKeys.detail(id ?? ''),
    queryFn: () => inboxApi.getConversation(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: POLL_INTERVAL_MS,
  })
}
