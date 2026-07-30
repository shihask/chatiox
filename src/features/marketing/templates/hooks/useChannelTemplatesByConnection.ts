import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/api/templatesApi'
import { channelTemplatesByConnectionKeys } from '@/features/marketing/templates/hooks/queryKeys'

export function useChannelTemplatesByConnection(connectionId: string | undefined) {
  return useQuery({
    queryKey: channelTemplatesByConnectionKeys.list(connectionId ?? ''),
    queryFn: () => templatesApi.listChannelTemplatesByConnection(connectionId ?? ''),
    enabled: Boolean(connectionId),
  })
}
