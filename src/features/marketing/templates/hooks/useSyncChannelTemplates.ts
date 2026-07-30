import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { templatesApi } from '@/api/templatesApi'
import { ApiError } from '@/api/apiClient'
import { templatesKeys, channelTemplatesByConnectionKeys } from '@/features/marketing/templates/hooks/queryKeys'

export function useSyncChannelTemplates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) => templatesApi.syncChannelTemplates(connectionId),
    onSuccess: async (data, connectionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: templatesKeys.all }),
        queryClient.invalidateQueries({ queryKey: channelTemplatesByConnectionKeys.list(connectionId) }),
      ])
      toast.success(`Synced ${String(data.length)} template${data.length === 1 ? '' : 's'} from WhatsApp`)
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to sync templates')
    },
  })
}
