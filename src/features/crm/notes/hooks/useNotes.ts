import { useQuery } from '@tanstack/react-query'
import { notesApi } from '@/api/notesApi'
import { notesKeys } from '@/features/crm/notes/hooks/queryKeys'
import type { ListNotesParams } from '@/features/crm/notes/types/note.types'

export function useNotes(params: ListNotesParams) {
  return useQuery({
    queryKey: notesKeys.list(params),
    queryFn: () => notesApi.list(params),
    placeholderData: (previousData) => previousData,
  })
}
