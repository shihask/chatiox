import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/api/contactsApi'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: contactsKeys.detail(id ?? ''),
    queryFn: () => contactsApi.getById(id ?? ''),
    enabled: Boolean(id),
  })
}
