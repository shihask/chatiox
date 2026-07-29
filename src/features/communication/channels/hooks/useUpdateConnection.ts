import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { channelsApi } from '@/api/channelsApi'
import { ApiError } from '@/api/apiClient'
import { channelConnectionsKeys } from '@/features/communication/channels/hooks/queryKeys'
import type { UpdateConnectionDTO } from '@/features/communication/channels/types/channel.types'

export function useUpdateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateConnectionDTO }) => channelsApi.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelConnectionsKeys.all })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update channel')
    },
  })
}
