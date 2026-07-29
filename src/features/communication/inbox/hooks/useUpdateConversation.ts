import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'
import type { ConversationDTO } from '@/features/communication/inbox/types/inbox.types'

interface UpdateConversationVars {
  id: string
  input: { status?: ConversationDTO['status']; assignedToUserId?: string | null; tags?: string[] }
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: UpdateConversationVars) => inboxApi.updateConversation(id, input),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update conversation')
    },
  })
}
