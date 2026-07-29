import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationsKeys, messagesKeys } from '@/features/communication/inbox/hooks/queryKeys'
import type { SendMessageDTO } from '@/features/communication/inbox/types/inbox.types'

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendMessageDTO) => inboxApi.sendMessage(conversationId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: messagesKeys.list(conversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(conversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to send message')
    },
  })
}
