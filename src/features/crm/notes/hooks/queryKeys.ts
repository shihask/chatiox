import type { ListNotesParams } from '@/features/crm/notes/types/note.types'

export const notesKeys = {
  all: ['notes'] as const,
  byContact: (contactId: string) => [...notesKeys.all, 'by-contact', contactId] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (params: ListNotesParams) => [...notesKeys.lists(), params] as const,
}
