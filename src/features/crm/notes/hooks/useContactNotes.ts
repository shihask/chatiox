import { useQuery } from '@tanstack/react-query'
import { notesApi } from '@/api/notesApi'
import { notesKeys } from '@/features/crm/notes/hooks/queryKeys'

export function useContactNotes(contactId: string) {
  return useQuery({
    queryKey: notesKeys.byContact(contactId),
    queryFn: () => notesApi.listByContact(contactId),
  })
}
