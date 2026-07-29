import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { channelsApi } from '@/api/channelsApi'
import { ApiError } from '@/api/apiClient'
import { channelConnectionsKeys } from '@/features/communication/channels/hooks/queryKeys'
import type { CreateConnectionDTO } from '@/features/communication/channels/types/channel.types'

export function useCreateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateConnectionDTO) => channelsApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelConnectionsKeys.all })
      toast.success('Channel connected')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to connect channel')
    },
  })
}
