import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inboxApi } from '@/api/inboxApi'
import { ApiError } from '@/api/apiClient'
import { conversationsKeys } from '@/features/communication/inbox/hooks/queryKeys'
import type { ChannelType } from '@/lib/channelTypes'

export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId, channelType }: { contactId: string; channelType: ChannelType }) =>
      inboxApi.startConversation(contactId, channelType),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to start conversation')
    },
  })
}
