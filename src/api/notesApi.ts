import { apiClient } from '@/api/apiClient'
import type { CreateNoteDTO, ListNotesParams, NoteDTO } from '@/features/crm/notes/types/note.types'

export const notesApi = {
  listByContact: (contactId: string) => apiClient.get<NoteDTO[]>(`/contacts/${contactId}/notes`),
  createForContact: (contactId: string, input: CreateNoteDTO) =>
    apiClient.post<NoteDTO>(`/contacts/${contactId}/notes`, input),

  list: (params: ListNotesParams) =>
    apiClient.getPaginated<NoteDTO>('/notes', {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      contactId: params.contactId,
      authorId: params.authorId,
    }),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`)
  },
}
