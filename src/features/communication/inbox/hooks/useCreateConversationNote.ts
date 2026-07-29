import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationNotesKeys } from '@/features/communication/inbox/hooks/queryKeys'

export function useCreateConversationNote(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => inboxApi.createConversationNote(conversationId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: conversationNotesKeys.list(conversationId) })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to add note')
    },
  })
}
