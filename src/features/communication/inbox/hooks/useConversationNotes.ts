import { useQuery } from '@tanstack/react-query'
import { inboxApi } from '@/api/inboxApi'
import { conversationNotesKeys } from '@/features/communication/inbox/hooks/queryKeys'

export function useConversationNotes(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationNotesKeys.list(conversationId ?? ''),
    queryFn: () => inboxApi.listConversationNotes(conversationId ?? ''),
    enabled: Boolean(conversationId),
  })
}
