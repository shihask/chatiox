import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/api/templatesApi'
import { templatesKeys } from '@/features/marketing/templates/hooks/queryKeys'

export function useTemplates() {
  return useQuery({
    queryKey: templatesKeys.lists(),
    queryFn: () => templatesApi.list(),
  })
}
