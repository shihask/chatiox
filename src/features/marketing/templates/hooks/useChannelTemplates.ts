import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/api/templatesApi'
import { templatesKeys } from '@/features/marketing/templates/hooks/queryKeys'

export function useChannelTemplates(templateId: string) {
  return useQuery({
    queryKey: templatesKeys.channelTemplates(templateId),
    queryFn: () => templatesApi.listChannelTemplates(templateId),
  })
}
