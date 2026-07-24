import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/api/contactsApi'
import { contactsKeys } from '@/features/crm/contacts/hooks/queryKeys'
import type { ListContactsParams } from '@/features/crm/contacts/types/contact.types'

export function useContacts(params: ListContactsParams) {
  return useQuery({
    queryKey: contactsKeys.list(params),
    queryFn: () => contactsApi.list(params),
    placeholderData: (previousData) => previousData,
  })
}
