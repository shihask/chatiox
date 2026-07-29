import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { channelsApi } from '@/api/channelsApi'
import { ApiError } from '@/api/apiClient'
import { channelConnectionsKeys } from '@/features/communication/channels/hooks/queryKeys'

export function useCompleteEmbeddedSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ secretId, wabaId, phoneNumberId }: { secretId: string; wabaId: string; phoneNumberId: string }) =>
      channelsApi.completeEmbeddedSignup(secretId, wabaId, phoneNumberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelConnectionsKeys.all })
      toast.success('WhatsApp connected')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to complete WhatsApp connection')
    },
  })
}
