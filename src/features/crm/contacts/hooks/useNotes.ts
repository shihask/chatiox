import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/api/contactsApi'
import { notesKeys } from '@/features/crm/contacts/hooks/queryKeys'

export function useNotes(contactId: string) {
  return useQuery({
    queryKey: notesKeys.byContact(contactId),
    queryFn: () => contactsApi.listNotes(contactId),
  })
}
