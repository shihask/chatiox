import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/api/contactsApi'
import { leadSourcesKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useLeadSources() {
  return useQuery({
    queryKey: leadSourcesKeys.all,
    queryFn: () => contactsApi.listLeadSources(),
    staleTime: 5 * 60 * 1000,
  })
}
